import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { DatabaseService } from '@/lib/db'
import { ErrorHandler } from '@/lib/error-handler'
import { HTTP_STATUS } from '@/lib/constants'

// Manual maintenance endpoint (could be secured with admin auth)
export const POST = async (request: NextRequest) => {
  const clientInfo = ApiHelpers.getClientInfo(request)
  
  try {
    // Perform database maintenance
    const results = await DatabaseService.performMaintenance()
    
    // Log maintenance activity
    await DatabaseService.logAuditEvent({
      action: 'maintenance_performed',
      details: {
        results,
        triggeredBy: 'manual',
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: true,
    })
    
    return ApiHelpers.successResponse(
      'Maintenance effectuée avec succès',
      {
        maintenance: results,
        timestamp: new Date().toISOString(),
      }
    )
  } catch (error) {
    return ErrorHandler.handleError(error, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      path: '/api/maintenance',
      method: 'POST',
    }, request)
  }
}

// Health check endpoint
export const GET = async (request: NextRequest) => {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      database: 'connected',
      email: 'configured',
    }
    
    // Test database connection
    try {
      await DatabaseService.cleanupExpiredCodes() // Simple query test
      health.database = 'connected'
    } catch (error) {
      health.database = 'error'
      health.status = 'degraded'
    }
    
    // Test email configuration
    try {
      const emailConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER)
      health.email = emailConfigured ? 'configured' : 'not configured'
    } catch (error) {
      health.email = 'error'
    }
    
    return ApiHelpers.successResponse(
      'Health check completed',
      health,
      health.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  } catch (error) {
    return ApiHelpers.errorResponse(
      'Health check failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
}

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions