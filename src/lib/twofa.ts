import { prisma, DatabaseService } from './db'
import { EmailService } from './email'
import { generateTwoFACode, getExpiryTime } from './utils'
import { AUTH_CONSTANTS, MESSAGES } from './constants'
import type { TwoFACode } from '@prisma/client'
import type { ApiResponse } from '@/types/api'

/**
 * Two-Factor Authentication service
 */
export class TwoFAService {
  /**
   * Generate and send 2FA code to user's email
   */
  static async sendCode(
    userId: string,
    email: string,
    ipAddress?: string
  ): Promise<ApiResponse<{ codeId: string }>> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return {
          success: false,
          message: MESSAGES.ERROR.USER_NOT_FOUND,
        }
      }

      // Check rate limiting for 2FA requests
      const rateLimit = await DatabaseService.checkRateLimit(
        ipAddress || userId,
        '2fa_send',
        AUTH_CONSTANTS.RATE_LIMIT.TWOFA.MAX_ATTEMPTS,
        AUTH_CONSTANTS.RATE_LIMIT.TWOFA.WINDOW_MINUTES
      )

      if (!rateLimit.allowed) {
        await DatabaseService.logAuditEvent({
          userId,
          action: '2fa_send_rate_limited',
          ipAddress,
          success: false,
        })

        return {
          success: false,
          message: MESSAGES.ERROR.RATE_LIMIT,
        }
      }

      // Clean up any existing codes for this user
      await prisma.twoFACode.deleteMany({
        where: {
          userId,
        },
      })

      // Generate new code
      const code = generateTwoFACode()
      const expiresAt = getExpiryTime(AUTH_CONSTANTS.TWOFA_CODE_EXPIRY_MINUTES)

      // Save code to database
      const twoFACode = await prisma.twoFACode.create({
        data: {
          userId,
          code,
          expiresAt,
        },
      })

      // Send email
      const emailSent = await EmailService.send2FACode(
        email,
        code,
        AUTH_CONSTANTS.TWOFA_CODE_EXPIRY_MINUTES
      )

      if (!emailSent) {
        // Delete the code if email failed
        await prisma.twoFACode.delete({
          where: { id: twoFACode.id },
        })

        await DatabaseService.logAuditEvent({
          userId,
          action: '2fa_send_email_failed',
          ipAddress,
          success: false,
        })

        return {
          success: false,
          message: MESSAGES.ERROR.EMAIL_SEND_FAILED,
        }
      }

      // Log successful send
      await DatabaseService.logAuditEvent({
        userId,
        action: '2fa_code_sent',
        details: {
          codeId: twoFACode.id,
          expiresAt: expiresAt.toISOString(),
        },
        ipAddress,
        success: true,
      })

      return {
        success: true,
        message: MESSAGES.SUCCESS.TWOFA_SENT,
        data: {
          codeId: twoFACode.id,
        },
      }
    } catch (error) {
      console.error('2FA send code error:', error)
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL,
      }
    }
  }

  /**
   * Verify 2FA code
   */
  static async verifyCode(
    email: string,
    code: string,
    ipAddress?: string
  ): Promise<ApiResponse<{ userId: string }>> {
    try {
      // Get user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (!user) {
        return {
          success: false,
          message: MESSAGES.ERROR.USER_NOT_FOUND,
        }
      }

      // Check rate limiting for 2FA verification
      const rateLimit = await DatabaseService.checkRateLimit(
        ipAddress || user.id,
        '2fa_verify',
        AUTH_CONSTANTS.RATE_LIMIT.TWOFA.MAX_ATTEMPTS,
        AUTH_CONSTANTS.RATE_LIMIT.TWOFA.WINDOW_MINUTES
      )

      if (!rateLimit.allowed) {
        await DatabaseService.logAuditEvent({
          userId: user.id,
          action: '2fa_verify_rate_limited',
          ipAddress,
          success: false,
        })

        return {
          success: false,
          message: MESSAGES.ERROR.RATE_LIMIT,
        }
      }

      // Find active 2FA code
      const twoFACode = await prisma.twoFACode.findFirst({
        where: {
          userId: user.id,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!twoFACode) {
        await DatabaseService.logAuditEvent({
          userId: user.id,
          action: '2fa_verify_no_code',
          ipAddress,
          success: false,
        })

        return {
          success: false,
          message: MESSAGES.ERROR.CODE_EXPIRED,
        }
      }

      // Check if max attempts reached
      if (twoFACode.attempts >= AUTH_CONSTANTS.TWOFA_MAX_ATTEMPTS) {
        // Delete the code
        await prisma.twoFACode.delete({
          where: { id: twoFACode.id },
        })

        await DatabaseService.logAuditEvent({
          userId: user.id,
          action: '2fa_verify_max_attempts',
          details: {
            codeId: twoFACode.id,
            attempts: twoFACode.attempts,
          },
          ipAddress,
          success: false,
        })

        return {
          success: false,
          message: MESSAGES.ERROR.CODE_MAX_ATTEMPTS,
        }
      }

      // Increment attempts
      await prisma.twoFACode.update({
        where: { id: twoFACode.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      })

      // Verify code
      if (twoFACode.code !== code) {
        await DatabaseService.logAuditEvent({
          userId: user.id,
          action: '2fa_verify_invalid_code',
          details: {
            codeId: twoFACode.id,
            attempts: twoFACode.attempts + 1,
          },
          ipAddress,
          success: false,
        })

        return {
          success: false,
          message: MESSAGES.ERROR.INVALID_CODE,
        }
      }

      // Code is valid - delete it and reset rate limit
      await prisma.twoFACode.delete({
        where: { id: twoFACode.id },
      })

      await DatabaseService.resetRateLimit(
        ipAddress || user.id,
        '2fa_verify'
      )

      await DatabaseService.logAuditEvent({
        userId: user.id,
        action: '2fa_verified',
        details: {
          codeId: twoFACode.id,
        },
        ipAddress,
        success: true,
      })

      return {
        success: true,
        message: MESSAGES.SUCCESS.TWOFA_VERIFIED,
        data: {
          userId: user.id,
        },
      }
    } catch (error) {
      console.error('2FA verify code error:', error)
      return {
        success: false,
        message: MESSAGES.ERROR.INTERNAL,
      }
    }
  }

  /**
   * Check if user has active 2FA code
   */
  static async hasActiveCode(userId: string): Promise<boolean> {
    const activeCode = await prisma.twoFACode.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    return !!activeCode
  }

  /**
   * Get time remaining for active code
   */
  static async getCodeTimeRemaining(userId: string): Promise<number | null> {
    const activeCode = await prisma.twoFACode.findFirst({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!activeCode) {
      return null
    }

    return Math.max(0, Math.floor((activeCode.expiresAt.getTime() - Date.now()) / 1000))
  }

  /**
   * Clean up expired codes
   */
  static async cleanupExpiredCodes(): Promise<number> {
    return DatabaseService.cleanupExpiredCodes()
  }
}