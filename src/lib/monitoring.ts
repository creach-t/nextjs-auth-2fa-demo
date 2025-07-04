import { DatabaseService } from './db'
import { SecurityService } from './security'
import { prisma } from './db'

/**
 * Monitoring and analytics service
 */
export class MonitoringService {
  /**
   * Get authentication statistics
   */
  static async getAuthStats(days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: {
          gte: startDate,
        },
        action: {
          in: [
            'register_success',
            'login_success',
            'login_success_pending_2fa',
            '2fa_verified',
            'logout',
          ],
        },
      },
      _count: {
        action: true,
      },
    })

    return stats.reduce((acc, stat) => {
      acc[stat.action] = stat._count.action
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Get security events statistics
   */
  static async getSecurityStats(days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const securityEvents = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: {
          gte: startDate,
        },
        action: {
          startsWith: 'security_',
        },
      },
      _count: {
        action: true,
      },
    })

    const failedLogins = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: startDate,
        },
        action: {
          in: [
            'login_invalid_password',
            'login_user_not_found',
            '2fa_verify_invalid_code',
            '2fa_verify_max_attempts',
          ],
        },
      },
    })

    return {
      securityEvents: securityEvents.reduce((acc, event) => {
        acc[event.action] = event._count.action
        return acc
      }, {} as Record<string, number>),
      failedLogins,
    }
  }

  /**
   * Get user registration trends
   */
  static async getRegistrationTrends(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const registrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by day
    const trendsByDay = registrations.reduce((acc, reg) => {
      const day = reg.createdAt.toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + reg._count.id
      return acc
    }, {} as Record<string, number>)

    return trendsByDay
  }

  /**
   * Get active sessions statistics
   */
  static async getSessionStats() {
    const activeSessions = await prisma.session.count({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    const totalSessions = await prisma.session.count()
    
    const sessionsLast24h = await prisma.session.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    })

    return {
      active: activeSessions,
      total: totalSessions,
      last24h: sessionsLast24h,
    }
  }

  /**
   * Get rate limiting statistics
   */
  static async getRateLimitStats() {
    const rateLimits = await prisma.rateLimit.groupBy({
      by: ['action'],
      _count: {
        action: true,
      },
      _avg: {
        attempts: true,
      },
      where: {
        resetTime: {
          gt: new Date(),
        },
      },
    })

    return rateLimits.map(rl => ({
      action: rl.action,
      activeRecords: rl._count.action,
      avgAttempts: Math.round(rl._avg.attempts || 0),
    }))
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Recent errors
    const recentErrors = await prisma.auditLog.count({
      where: {
        success: false,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    // Recent successful operations
    const recentSuccess = await prisma.auditLog.count({
      where: {
        success: true,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    // Database size (approximation)
    const tables = [
      'User',
      'Session',
      'TwoFACode',
      'AuditLog',
      'RateLimit',
    ]

    const tableCounts = await Promise.all(
      tables.map(async (table) => {
        const count = await (prisma as any)[table.toLowerCase()].count()
        return { table, count }
      })
    )

    const totalRecords = tableCounts.reduce((sum, t) => sum + t.count, 0)

    // Calculate uptime (simplified)
    const uptimePercentage = recentSuccess + recentErrors > 0 
      ? (recentSuccess / (recentSuccess + recentErrors)) * 100 
      : 100

    return {
      uptime: uptimePercentage,
      recentErrors,
      recentSuccess,
      database: {
        totalRecords,
        tables: tableCounts,
      },
      timestamp: now.toISOString(),
    }
  }

  /**
   * Generate comprehensive dashboard data
   */
  static async getDashboardData() {
    const [authStats, securityStats, registrationTrends, sessionStats, rateLimitStats, systemHealth] = await Promise.all([
      this.getAuthStats(),
      this.getSecurityStats(),
      this.getRegistrationTrends(),
      this.getSessionStats(),
      this.getRateLimitStats(),
      this.getSystemHealth(),
    ])

    return {
      authentication: authStats,
      security: securityStats,
      registrations: registrationTrends,
      sessions: sessionStats,
      rateLimiting: rateLimitStats,
      system: systemHealth,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Log performance metric
   */
  static async logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    metadata?: any
  ) {
    await DatabaseService.logAuditEvent({
      action: 'performance_metric',
      details: {
        metric,
        value,
        unit,
        metadata,
      },
      success: true,
    })
  }

  /**
   * Check for performance anomalies
   */
  static async checkPerformanceAnomalies() {
    // This is a simplified example - in production you'd have more sophisticated checks
    const recentErrors = await prisma.auditLog.count({
      where: {
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
    })

    // Alert if too many errors
    if (recentErrors > 10) {
      await SecurityService.logSecurityEvent('suspicious_activity', {
        severity: 'high',
        details: {
          reason: 'High error rate detected',
          errorCount: recentErrors,
          timeWindow: '10 minutes',
        },
      })
    }

    return {
      anomaliesDetected: recentErrors > 10,
      errorCount: recentErrors,
      threshold: 10,
    }
  }
}