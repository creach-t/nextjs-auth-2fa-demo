import { PrismaClient } from "@prisma/client";

// Global declaration for TypeScript
declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };

// Database utility functions
export class DatabaseService {
  /**
   * Clean up expired 2FA codes
   */
  static async cleanupExpiredCodes(): Promise<number> {
    const result = await prisma.twoFACode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Clean up old rate limit entries
   */
  static async cleanupExpiredRateLimits(): Promise<number> {
    const result = await prisma.rateLimit.deleteMany({
      where: {
        resetTime: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Clean up old audit logs (older than 90 days)
   */
  static async cleanupOldAuditLogs(): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });
    return result.count;
  }

  /**
   * Perform all cleanup operations
   */
  static async performMaintenance(): Promise<{
    expiredCodes: number;
    expiredSessions: number;
    expiredRateLimits: number;
    oldAuditLogs: number;
  }> {
    const [expiredCodes, expiredSessions, expiredRateLimits, oldAuditLogs] =
      await Promise.all([
        this.cleanupExpiredCodes(),
        this.cleanupExpiredSessions(),
        this.cleanupExpiredRateLimits(),
        this.cleanupOldAuditLogs(),
      ]);

    return {
      expiredCodes,
      expiredSessions,
      expiredRateLimits,
      oldAuditLogs,
    };
  }

  /**
   * Get user with active 2FA codes
   */
  static async getUserWithActiveCodes(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        twoFACodes: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  /**
   * Get user sessions
   */
  static async getUserSessions(userId: string) {
    return await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Log audit event
   */
  static async logAuditEvent({
    userId,
    action,
    details,
    ipAddress,
    userAgent,
    success = true,
  }: {
    userId?: string;
    action: string;
    details?: object;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
  }) {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
        success,
      },
    });
  }

  /**
   * Check rate limit
   */
  static async checkRateLimit(
    identifier: string,
    action: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<{ allowed: boolean; attempts: number; resetTime: Date }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Clean up expired rate limits first
    await prisma.rateLimit.deleteMany({
      where: {
        identifier,
        action,
        resetTime: {
          lt: now,
        },
      },
    });

    // Get or create rate limit record
    const rateLimit = await prisma.rateLimit.upsert({
      where: {
        identifier_action: {
          identifier,
          action,
        },
      },
      update: {
        attempts: {
          increment: 1,
        },
        updatedAt: now,
      },
      create: {
        identifier,
        action,
        attempts: 1,
        resetTime: new Date(now.getTime() + windowMinutes * 60 * 1000),
      },
    });

    return {
      allowed: rateLimit.attempts <= maxAttempts,
      attempts: rateLimit.attempts,
      resetTime: rateLimit.resetTime,
    };
  }

  /**
   * Reset rate limit for an identifier and action
   */
  static async resetRateLimit(identifier: string, action: string) {
    await prisma.rateLimit.deleteMany({
      where: {
        identifier,
        action,
      },
    });
  }
}
