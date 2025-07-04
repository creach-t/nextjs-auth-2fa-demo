import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { AuthService } from '@/lib/auth'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const GET = ApiHelpers.asyncHandler(async (request: NextRequest) => {
  const authUser = ApiHelpers.getAuthUser(request)
  
  if (!authUser) {
    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  try {
    // Get full user details
    const user = await AuthService.getUserById(authUser.id)
    
    if (!user) {
      return ApiHelpers.errorResponse(
        MESSAGES.ERROR.USER_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    return ApiHelpers.successResponse(
      'Profil utilisateur récupéré avec succès',
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }
    )
  } catch (error) {
    console.error('Get user profile error:', error)
    
    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.INTERNAL,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions