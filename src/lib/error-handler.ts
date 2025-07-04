import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { ApiHelpers } from './api-helpers'
import { DatabaseService } from './db'
import { SecurityService } from './security'
import { HTTP_STATUS, MESSAGES } from './constants'
import type { ApiResponse } from '@/types/api'

export interface ErrorContext {
  userId?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  path?: string
  method?: string
  body?: any
}

/**
 * Enhanced error handling with security logging
 */
export class ErrorHandler {
  /**
   * Handle and classify different types of errors
   */
  static async handleError(
    error: unknown,
    context: ErrorContext,
    request?: NextRequest
  ): Promise<NextResponse> {
    // Generate error ID for tracking
    const errorId = Math.random().toString(36).substring(2, 15)
    
    console.error(`[Error ${errorId}]:`, error, context)

    // Log error to database
    await this.logError(error, context, errorId)

    // Handle specific error types
    if (error instanceof ZodError) {
      return this.handleValidationError(error, errorId)
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleDatabaseError(error, context, errorId)
    }

    if (error instanceof SecurityError) {
      return this.handleSecurityError(error, context, errorId)
    }

    if (error instanceof RateLimitError) {
      return this.handleRateLimitError(error, errorId)
    }

    if (error instanceof AuthenticationError) {
      return this.handleAuthError(error, errorId)
    }

    // Default internal server error
    return this.handleInternalError(error, errorId)
  }

  /**
   * Handle validation errors (Zod)
   */
  private static handleValidationError(error: ZodError, errorId: string): NextResponse {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.VALIDATION,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      `Erreur de validation [${errorId}]`,
      validationErrors.map(e => `${e.field}: ${e.message}`)
    )
  }

  /**
   * Handle database errors
   */
  private static async handleDatabaseError(
    error: Prisma.PrismaClientKnownRequestError,
    context: ErrorContext,
    errorId: string
  ): Promise<NextResponse> {
    // Log database error for monitoring
    await SecurityService.logSecurityEvent('suspicious_activity', {
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      severity: 'medium',
      details: {
        errorCode: error.code,
        errorId,
        operation: 'database',
      },
    })

    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return ApiHelpers.errorResponse(
          'Cette ressource existe déjà',
          HTTP_STATUS.CONFLICT,
          `Contrainte unique violée [${errorId}]`
        )
      
      case 'P2025': // Record not found
        return ApiHelpers.errorResponse(
          'Ressource non trouvée',
          HTTP_STATUS.NOT_FOUND,
          `Enregistrement introuvable [${errorId}]`
        )
      
      case 'P2003': // Foreign key constraint
        return ApiHelpers.errorResponse(
          'Opération non autorisée',
          HTTP_STATUS.BAD_REQUEST,
          `Contrainte de clé étrangère [${errorId}]`
        )
      
      default:
        return ApiHelpers.errorResponse(
          MESSAGES.ERROR.INTERNAL,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          `Erreur de base de données [${errorId}]`
        )
    }
  }

  /**
   * Handle security errors
   */
  private static async handleSecurityError(
    error: SecurityError,
    context: ErrorContext,
    errorId: string
  ): Promise<NextResponse> {
    await SecurityService.logSecurityEvent('blocked_request', {
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      severity: error.severity,
      details: {
        reason: error.reason,
        errorId,
      },
    })

    return ApiHelpers.errorResponse(
      error.message,
      error.statusCode,
      `Violation de sécurité [${errorId}]`
    )
  }

  /**
   * Handle rate limit errors
   */
  private static handleRateLimitError(error: RateLimitError, errorId: string): NextResponse {
    const response = ApiHelpers.errorResponse(
      error.message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      `Limite de taux dépassée [${errorId}]`
    )

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', error.limit.toString())
    response.headers.set('X-RateLimit-Remaining', error.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(error.resetTime.getTime() / 1000).toString())
    response.headers.set('Retry-After', Math.ceil((error.resetTime.getTime() - Date.now()) / 1000).toString())

    return response
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: AuthenticationError, errorId: string): NextResponse {
    return ApiHelpers.errorResponse(
      error.message,
      error.statusCode,
      `Erreur d'authentification [${errorId}]`
    )
  }

  /**
   * Handle internal server errors
   */
  private static handleInternalError(error: unknown, errorId: string): NextResponse {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.INTERNAL,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `Erreur interne [${errorId}]: ${message}`
    )
  }

  /**
   * Log error to database for monitoring
   */
  private static async logError(
    error: unknown,
    context: ErrorContext,
    errorId: string
  ): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined

      await DatabaseService.logAuditEvent({
        userId: context.userId,
        action: 'application_error',
        details: {
          errorId,
          errorType: error?.constructor?.name || 'Unknown',
          errorMessage,
          errorStack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
          path: context.path,
          method: context.method,
          userAgent: context.userAgent,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: false,
      })
    } catch (loggingError) {
      // Fallback logging if database logging fails
      console.error('Failed to log error to database:', loggingError)
    }
  }

  /**
   * Create error response with security headers
   */
  static createSecureErrorResponse(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errorId?: string
  ): NextResponse {
    const response = ApiHelpers.errorResponse(
      message,
      statusCode,
      errorId ? `Erreur [${errorId}]` : undefined
    )

    return SecurityService.applySecurityHeaders(response)
  }
}

// Custom error classes
export class SecurityError extends Error {
  constructor(
    message: string,
    public reason: string,
    public severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public statusCode: number = HTTP_STATUS.FORBIDDEN
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public limit: number,
    public remaining: number,
    public resetTime: Date
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.UNAUTHORIZED
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}