import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { AuthService } from '@/lib/auth'
import { SecurityService } from '@/lib/security'
import { ErrorHandler, AuthenticationError } from '@/lib/error-handler'
import { DatabaseService } from '@/lib/db'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const POST = async (request: NextRequest) => {
  const clientInfo = ApiHelpers.getClientInfo(request)
  
  try {
    // Get refresh token from cookies
    const refreshToken = request.cookies.get('refresh-token')?.value
    
    if (!refreshToken) {
      throw new AuthenticationError(
        'Token de rafraîchissement manquant',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    // Check rate limiting for refresh attempts
    const rateLimit = await SecurityService.checkAdvancedRateLimit(
      clientInfo.ipAddress,
      'token_refresh',
      'normal'
    )

    if (!rateLimit.allowed) {
      await SecurityService.logSecurityEvent('rate_limit_exceeded', {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        severity: 'medium',
        details: {
          action: 'token_refresh',
          remaining: rateLimit.remaining,
        },
      })

      return ApiHelpers.errorResponse(
        MESSAGES.ERROR.RATE_LIMIT,
        HTTP_STATUS.TOO_MANY_REQUESTS
      )
    }

    // Refresh the access token
    const refreshResult = await AuthService.refreshAccessToken(refreshToken)
    
    if (!refreshResult) {
      // Log failed refresh attempt
      await SecurityService.logSecurityEvent('invalid_token', {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        severity: 'medium',
        details: {
          tokenType: 'refresh',
          action: 'refresh_failed',
        },
      })

      throw new AuthenticationError(
        'Token de rafraîchissement invalide ou expiré',
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    // Log successful token refresh
    await DatabaseService.logAuditEvent({
      userId: refreshResult.user.id,
      action: 'token_refresh_success',
      details: {
        email: refreshResult.user.email,
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    // Create response with new token
    const response = ApiHelpers.successResponse(
      'Token rafraîchi avec succès',
      {
        user: {
          id: refreshResult.user.id,
          email: refreshResult.user.email,
          name: refreshResult.user.name,
        },
        token: refreshResult.accessToken,
      }
    )

    // Set new access token in cookie
    response.cookies.set('auth-token', refreshResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    })

    return SecurityService.applySecurityHeaders(response)
  } catch (error) {
    return ErrorHandler.handleError(error, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      path: '/api/auth/refresh',
      method: 'POST',
    }, request)
  }
}

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions