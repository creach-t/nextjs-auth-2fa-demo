import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { TwoFAService } from '@/lib/twofa'
import { DatabaseService } from '@/lib/db'
import { resetPasswordRequestSchema } from '@/lib/validations'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const POST = ApiHelpers.asyncHandler(async (request: NextRequest) => {
  const authUser = ApiHelpers.getAuthUser(request)
  const clientInfo = ApiHelpers.getClientInfo(request)
  
  // This endpoint can be used by authenticated users to resend 2FA codes
  // or for password reset flows
  
  if (!authUser) {
    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  try {
    const result = await TwoFAService.sendCode(
      authUser.id,
      authUser.email,
      clientInfo.ipAddress
    )

    if (!result.success) {
      return ApiHelpers.errorResponse(
        result.message,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    return ApiHelpers.successResponse(
      result.message,
      result.data
    )
  } catch (error) {
    console.error('Send 2FA code error:', error)
    
    await DatabaseService.logAuditEvent({
      userId: authUser.id,
      action: '2fa_send_error',
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