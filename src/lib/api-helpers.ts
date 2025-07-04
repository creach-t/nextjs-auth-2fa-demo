import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { DatabaseService } from './db'
import { HTTP_STATUS, MESSAGES } from './constants'
import type { ApiResponse, ValidationError } from '@/types/api'

/**
 * API utility functions for consistent error handling and validation
 */
export class ApiHelpers {
  /**
   * Get client information from request
   */
  static getClientInfo(request: NextRequest) {
    return {
      ipAddress: request.headers.get('x-client-ip') || 
                request.ip || 
                request.headers.get('x-forwarded-for') || 
                'unknown',
      userAgent: request.headers.get('x-user-agent') || 
                request.headers.get('user-agent') || 
                'unknown',
    }
  }

  /**
   * Get authenticated user info from request headers
   */
  static getAuthUser(request: NextRequest) {
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    if (!userId || !userEmail) {
      return null
    }
    
    return {
      id: userId,
      email: userEmail,
    }
  }

  /**
   * Create success response
   */
  static successResponse<T>(
    message: string,
    data?: T,
    status: number = HTTP_STATUS.OK
  ): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    }
    
    return NextResponse.json(response, { status })
  }

  /**
   * Create error response
   */
  static errorResponse(
    message: string,
    status: number = HTTP_STATUS.BAD_REQUEST,
    error?: string,
    details?: string[]
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      details,
    }
    
    return NextResponse.json(response, { status })
  }

  /**
   * Create validation error response
   */
  static validationErrorResponse(errors: ValidationError[]): NextResponse {
    return this.errorResponse(
      MESSAGES.ERROR.VALIDATION,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'Erreurs de validation',
      errors.map(err => `${err.field}: ${err.message}`)
    )
  }

  /**
   * Validate request body with Zod schema
   */
  static async validateRequestBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
    try {
      const body = await request.json()
      const data = schema.parse(body)
      return { success: true, data }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }))
        
        return {
          success: false,
          response: this.validationErrorResponse(validationErrors),
        }
      }
      
      return {
        success: false,
        response: this.errorResponse(
          'Format de données invalide',
          HTTP_STATUS.BAD_REQUEST
        ),
      }
    }
  }

  /**
   * Handle async API route with error catching
   */
  static asyncHandler(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        return await handler(request, context)
      } catch (error) {
        console.error('API Route Error:', error)
        
        // Log error for debugging
        const clientInfo = this.getClientInfo(request)
        const authUser = this.getAuthUser(request)
        
        await DatabaseService.logAuditEvent({
          userId: authUser?.id,
          action: 'api_error',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            path: request.nextUrl.pathname,
            method: request.method,
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          success: false,
        })
        
        return this.errorResponse(
          MESSAGES.ERROR.INTERNAL,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      }
    }
  }

  /**
   * Check rate limit for API endpoints
   */
  static async checkRateLimit(
    request: NextRequest,
    action: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<{ allowed: boolean; response?: NextResponse }> {
    const clientInfo = this.getClientInfo(request)
    const authUser = this.getAuthUser(request)
    
    // Use user ID if authenticated, otherwise use IP address
    const identifier = authUser?.id || clientInfo.ipAddress
    
    const rateLimit = await DatabaseService.checkRateLimit(
      identifier,
      action,
      maxAttempts,
      windowMinutes
    )
    
    if (!rateLimit.allowed) {
      const response = this.errorResponse(
        MESSAGES.ERROR.RATE_LIMIT,
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', maxAttempts.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime.getTime() / 1000).toString())
      
      return { allowed: false, response }
    }
    
    return { allowed: true }
  }

  /**
   * Set CORS headers
   */
  static setCorsHeaders(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  /**
   * Handle OPTIONS request for CORS
   */
  static handleOptions(): NextResponse {
    const response = new NextResponse(null, { status: 200 })
    return this.setCorsHeaders(response)
  }

  /**
   * Set secure headers
   */
  static setSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      )
    }
    
    return response
  }

  /**
   * Create a complete API response with security headers
   */
  static createResponse<T>(
    data: ApiResponse<T>,
    status: number = HTTP_STATUS.OK
  ): NextResponse {
    const response = NextResponse.json(data, { status })
    return this.setSecurityHeaders(response)
  }
}