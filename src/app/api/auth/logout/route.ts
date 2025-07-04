import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { AuthService } from '@/lib/auth'
import { DatabaseService } from '@/lib/db'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const POST = ApiHelpers.asyncHandler(async (request: NextRequest) => {
  const clientInfo = ApiHelpers.getClientInfo(request)
  const authUser = ApiHelpers.getAuthUser(request)
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('auth-token')?.value
  const refreshToken = request.cookies.get('refresh-token')?.value

  try {
    if (accessToken) {
      // Invalidate current session
      await AuthService.invalidateSession(accessToken)
    }

    if (authUser) {
      // Log logout event
      await DatabaseService.logAuditEvent({
        userId: authUser.id,
        action: 'logout',
        details: {
          email: authUser.email,
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: true,
      })
    }

    // Create response and clear cookies
    const response = ApiHelpers.successResponse(
      MESSAGES.SUCCESS.LOGOUT,
      { success: true }
    )

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    })

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    
    await DatabaseService.logAuditEvent({
      userId: authUser?.id,
      action: 'logout_error',
      details: {
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