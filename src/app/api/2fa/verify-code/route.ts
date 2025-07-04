import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { AuthService } from '@/lib/auth'
import { TwoFAService } from '@/lib/twofa'
import { DatabaseService } from '@/lib/db'
import { verifyTwoFASchema } from '@/lib/validations'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'
import type { AuthResponse } from '@/types/auth'

export const POST = ApiHelpers.asyncHandler(async (request: NextRequest) => {
  // Validate request body
  const validation = await ApiHelpers.validateRequestBody(request, verifyTwoFASchema)
  if (!validation.success) {
    return validation.response
  }

  const { email, code } = validation.data
  const clientInfo = ApiHelpers.getClientInfo(request)

  try {
    // Verify 2FA code
    const verificationResult = await TwoFAService.verifyCode(
      email,
      code,
      clientInfo.ipAddress
    )

    if (!verificationResult.success) {
      return ApiHelpers.errorResponse(
        verificationResult.message,
        HTTP_STATUS.UNAUTHORIZED
      )
    }

    const userId = verificationResult.data!.userId

    // Get user details
    const user = await AuthService.getUserById(userId)
    if (!user) {
      return ApiHelpers.errorResponse(
        MESSAGES.ERROR.USER_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    }

    const accessToken = AuthService.generateAccessToken(tokenPayload)
    const refreshToken = AuthService.generateRefreshToken(tokenPayload)

    // Create session
    await AuthService.createSession(
      user.id,
      accessToken,
      refreshToken,
      clientInfo.ipAddress,
      clientInfo.userAgent
    )

    // Log successful login
    await DatabaseService.logAuditEvent({
      userId: user.id,
      action: 'login_success',
      details: {
        email: user.email,
        method: '2fa',
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })

    const response: AuthResponse = {
      success: true,
      message: MESSAGES.SUCCESS.TWOFA_VERIFIED,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
      token: accessToken,
      refreshToken,
    }

    // Set cookies
    const apiResponse = ApiHelpers.successResponse(response.message, response)
    
    apiResponse.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    })
    
    apiResponse.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return apiResponse
  } catch (error) {
    console.error('2FA verification error:', error)
    
    await DatabaseService.logAuditEvent({
      action: '2fa_verify_internal_error',
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