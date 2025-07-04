import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { AuthService } from '@/lib/auth'
import { DatabaseService } from '@/lib/db'
import { EmailService } from '@/lib/email'
import { registerSchema } from '@/lib/validations'
import { AUTH_CONSTANTS, MESSAGES, HTTP_STATUS } from '@/lib/constants'
import type { AuthResponse } from '@/types/auth'

export const POST = ApiHelpers.asyncHandler(async (request: NextRequest) => {
  // Validate request body
  const validation = await ApiHelpers.validateRequestBody(request, registerSchema)
  if (!validation.success) {
    return validation.response
  }

  const { email, password, name } = validation.data
  const clientInfo = ApiHelpers.getClientInfo(request)

  // Check rate limiting
  const rateLimit = await ApiHelpers.checkRateLimit(
    request,
    'register',
    AUTH_CONSTANTS.RATE_LIMIT.REGISTER.MAX_ATTEMPTS,
    AUTH_CONSTANTS.RATE_LIMIT.REGISTER.WINDOW_MINUTES
  )

  if (!rateLimit.allowed) {
    return rateLimit.response!
  }

  try {
    // Check if user already exists
    const existingUser = await AuthService.getUserByEmail(email)
    if (existingUser) {
      await DatabaseService.logAuditEvent({
        action: 'register_user_exists',
        details: { email },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
      })

      return ApiHelpers.errorResponse(
        MESSAGES.ERROR.USER_EXISTS,
        HTTP_STATUS.CONFLICT
      )
    }

    // Create new user
    const user = await AuthService.createUser(email, password, name)

    // Log successful registration
    await DatabaseService.logAuditEvent({
      userId: user.id,
      action: 'register_success',
      details: {
        email: user.email,
        name: user.name,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    // Send welcome email (non-blocking)
    EmailService.sendWelcomeEmail(user.email, user.name || undefined)
      .catch(error => {
        console.error('Welcome email sending failed:', error)
        // Log but don't fail the registration
        DatabaseService.logAuditEvent({
          userId: user.id,
          action: 'welcome_email_failed',
          details: {
            email: user.email,
            error: error.message,
          },
          ipAddress: clientInfo.ipAddress,
          success: false,
        })
      })

    const response: AuthResponse = {
      success: true,
      message: MESSAGES.SUCCESS.REGISTER,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
    }

    return ApiHelpers.successResponse(
      response.message,
      response,
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    console.error('Registration error:', error)
    
    await DatabaseService.logAuditEvent({
      action: 'register_internal_error',
      details: {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: false,
    })

    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.INTERNAL,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions