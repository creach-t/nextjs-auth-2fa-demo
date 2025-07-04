import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { SessionManager } from '@/lib/session-manager'
import { ErrorHandler } from '@/lib/error-handler'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'

// Get user's active sessions
export const GET = async (request: NextRequest) => {
  const authUser = ApiHelpers.getAuthUser(request)
  const clientInfo = ApiHelpers.getClientInfo(request)
  
  if (!authUser) {
    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  try {
    const sessions = await SessionManager.getUserSessions(authUser.id)
    
    // Remove sensitive information and format for display
    const safeSessions = sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      // Mask IP address for privacy
      ipAddress: session.ipAddress ? `${session.ipAddress.substring(0, 8)}...` : 'Unknown',
      // Truncate user agent
      userAgent: session.userAgent ? 
        session.userAgent.substring(0, 50) + (session.userAgent.length > 50 ? '...' : '') : 
        'Unknown',
      isCurrent: session.token === request.cookies.get('auth-token')?.value,
    }))

    return ApiHelpers.successResponse(
      'Sessions récupérées avec succès',
      { sessions: safeSessions }
    )
  } catch (error) {
    return ErrorHandler.handleError(error, {
      userId: authUser.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      path: '/api/security/sessions',
      method: 'GET',
    }, request)
  }
}

// Terminate a specific session
export const DELETE = async (request: NextRequest) => {
  const authUser = ApiHelpers.getAuthUser(request)
  const clientInfo = ApiHelpers.getClientInfo(request)
  
  if (!authUser) {
    return ApiHelpers.errorResponse(
      MESSAGES.ERROR.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    )
  }

  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return ApiHelpers.errorResponse(
        'ID de session requis',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Verify the session belongs to the user
    const userSessions = await SessionManager.getUserSessions(authUser.id)
    const sessionExists = userSessions.some(s => s.id === sessionId)
    
    if (!sessionExists) {
      return ApiHelpers.errorResponse(
        'Session non trouvée',
        HTTP_STATUS.NOT_FOUND
      )
    }

    await SessionManager.invalidateSession(sessionId)

    return ApiHelpers.successResponse(
      'Session terminée avec succès',
      { sessionId }
    )
  } catch (error) {
    return ErrorHandler.handleError(error, {
      userId: authUser.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      path: '/api/security/sessions',
      method: 'DELETE',
    }, request)
  }
}

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions