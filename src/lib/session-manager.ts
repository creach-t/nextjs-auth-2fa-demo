import { prisma } from './db'
import { SecurityService } from './security'
import { AuthService } from './auth'
import type { Session, User } from '@prisma/client'

export interface SessionInfo {
  id: string
  token: string
  userId: string
  ipAddress?: string
  userAgent?: string
  fingerprint?: string
  expiresAt: Date
  createdAt: Date
  isActive: boolean
}

/**
 * Enhanced session management with security features
 */
export class SessionManager {
  /**
   * Create a new secure session
   */
  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    fingerprint?: string
  ): Promise<SessionInfo> {
    // Generate tokens
    const user = await AuthService.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
    }

    const accessToken = AuthService.generateAccessToken(tokenPayload)
    const refreshToken = AuthService.generateRefreshToken(tokenPayload)

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
        ipAddress: SecurityService.hashIP(ipAddress), // Store hashed IP
        userAgent: userAgent.substring(0, 500), // Limit length
      },
    })

    return {
      id: session.id,
      token: accessToken,
      userId: session.userId,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      fingerprint,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      isActive: session.isActive,
    }
  }

  /**
   * Validate session with security checks
   */
  static async validateSession(
    token: string,
    ipAddress: string,
    userAgent: string,
    fingerprint?: string
  ): Promise<{ valid: boolean; session?: SessionInfo & { user: User }; reason?: string }> {
    try {
      // Get session from database
      const session = await prisma.session.findUnique({
        where: {
          token,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      })

      if (!session) {
        return { valid: false, reason: 'Session not found or expired' }
      }

      // Verify JWT token
      const payload = AuthService.verifyAccessToken(token)
      if (!payload || payload.userId !== session.userId) {
        await this.invalidateSession(session.id)
        return { valid: false, reason: 'Invalid token' }
      }

      // Security checks
      const hashedCurrentIP = SecurityService.hashIP(ipAddress)
      
      // Check for IP address change (relaxed check)
      if (session.ipAddress && session.ipAddress !== hashedCurrentIP) {
        // Log suspicious activity but don't invalidate session
        await SecurityService.logSecurityEvent('suspicious_activity', {
          userId: session.userId,
          ipAddress,
          userAgent,
          severity: 'low',
          details: {
            reason: 'IP address changed',
            sessionId: session.id,
          },
        })
      }

      // Check for user agent change (more strict)
      const currentUAHash = userAgent.substring(0, 100)
      const storedUAHash = session.userAgent?.substring(0, 100)
      
      if (storedUAHash && currentUAHash !== storedUAHash) {
        await SecurityService.logSecurityEvent('suspicious_activity', {
          userId: session.userId,
          ipAddress,
          userAgent,
          severity: 'medium',
          details: {
            reason: 'User agent changed significantly',
            sessionId: session.id,
          },
        })
        
        // Optionally invalidate session for significant UA changes
        // await this.invalidateSession(session.id)
        // return { valid: false, reason: 'User agent mismatch' }
      }

      // Update last activity
      await prisma.session.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
      })

      return {
        valid: true,
        session: {
          id: session.id,
          token: session.token,
          userId: session.userId,
          ipAddress: session.ipAddress || undefined,
          userAgent: session.userAgent || undefined,
          fingerprint,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
          isActive: session.isActive,
          user: session.user,
        },
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return { valid: false, reason: 'Session validation failed' }
    }
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    })
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    })
    
    return result.count
  }

  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return sessions.map(session => ({
      id: session.id,
      token: session.token,
      userId: session.userId,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      isActive: session.isActive,
    }))
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false },
        ],
      },
    })
    
    return result.count
  }

  /**
   * Check for concurrent sessions (security monitoring)
   */
  static async checkConcurrentSessions(
    userId: string,
    maxConcurrentSessions: number = 5
  ): Promise<{ allowed: boolean; activeCount: number }> {
    const activeSessions = await prisma.session.count({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    return {
      allowed: activeSessions < maxConcurrentSessions,
      activeCount: activeSessions,
    }
  }

  /**
   * Session timeout based on inactivity
   */
  static async checkSessionTimeout(
    sessionId: string,
    timeoutMinutes: number = 60
  ): Promise<{ valid: boolean; reason?: string }> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return { valid: false, reason: 'Session not found' }
    }

    const timeoutThreshold = new Date()
    timeoutThreshold.setMinutes(timeoutThreshold.getMinutes() - timeoutMinutes)

    if (session.updatedAt < timeoutThreshold) {
      await this.invalidateSession(sessionId)
      return { valid: false, reason: 'Session timed out due to inactivity' }
    }

    return { valid: true }
  }
}