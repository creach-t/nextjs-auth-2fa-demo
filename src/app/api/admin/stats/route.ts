import { NextRequest } from 'next/server'
import { ApiHelpers } from '@/lib/api-helpers'
import { MonitoringService } from '@/lib/monitoring'
import { ErrorHandler } from '@/lib/error-handler'
import { MESSAGES, HTTP_STATUS } from '@/lib/constants'

// Get admin statistics (in a real app, this would require admin authentication)
export const GET = async (request: NextRequest) => {
  const clientInfo = ApiHelpers.getClientInfo(request)
  
  try {
    // In a real application, you would verify admin authentication here
    // For the demo, we'll allow access but log the request
    
    const dashboardData = await MonitoringService.getDashboardData()
    
    // Log admin access
    await MonitoringService.logPerformanceMetric(
      'admin_dashboard_access',
      1,
      'count',
      {
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      }
    )
    
    return ApiHelpers.successResponse(
      'Statistiques administrateur récupérées avec succès',
      dashboardData
    )
  } catch (error) {
    return ErrorHandler.handleError(error, {
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      path: '/api/admin/stats',
      method: 'GET',
    }, request)
  }
}

// Handle OPTIONS for CORS
export const OPTIONS = ApiHelpers.handleOptions