import type { AuthSession, JWTPayload } from "@/types/auth";
import type { Session, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    "JWT secrets are not configured. Please set JWT_SECRET and JWT_REFRESH_SECRET environment variables."
  );
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: "15m", // Short-lived access token
      issuer: "nextjs-auth-2fa-demo",
      audience: "nextjs-auth-2fa-demo-users",
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: "7d", // Long-lived refresh token
      issuer: "nextjs-auth-2fa-demo",
      audience: "nextjs-auth-2fa-demo-users",
    });
  }

  /**
   * Verify and decode JWT access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      console.log("🔍 JWT_SECRET defined:", !!JWT_SECRET);
      console.log(
        "🔍 JWT_SECRET preview:",
        JWT_SECRET?.substring(0, 10) + "..."
      );

      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: "nextjs-auth-2fa-demo",
        audience: "nextjs-auth-2fa-demo-users",
      }) as JWTPayload;

      console.log("✅ Token verified successfully:", {
        userId: decoded.userId,
        email: decoded.email,
        exp: decoded.exp,
        iat: decoded.iat,
      });

      return decoded;
    } catch (error) {
      console.log("❌ JWT verification error:", error.message);
      console.log("❌ Error name:", error.name);
      return null;
    }
  }

  /**
   * Verify and decode JWT refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: "nextjs-auth-2fa-demo",
        audience: "nextjs-auth-2fa-demo-users",
      }) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create user session in database
   */
  static async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Session> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    return prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get session by token
   */
  static async getSessionByToken(
    token: string
  ): Promise<(Session & { user: User }) | null> {
    return prisma.session.findUnique({
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
    });
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    user: User;
  } | null> {
    const session = await prisma.session.findUnique({
      where: {
        refreshToken,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload || payload.userId !== session.userId) {
      return null;
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
    });

    // Update session with new access token
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        token: newAccessToken,
        updatedAt: new Date(),
      },
    });

    return {
      accessToken: newAccessToken,
      user: session.user,
    };
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(token: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        token,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Invalidate all user sessions
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Create new user
   */
  static async createUser(
    email: string,
    password: string,
    name?: string
  ): Promise<User> {
    const hashedPassword = await this.hashPassword(password);

    return prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
    });
  }

  /**
   * Update user
   */
  static async updateUser(
    id: string,
    data: Partial<Pick<User, "email" | "name">>
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        ...data,
        email: data.email?.toLowerCase(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Change user password
   */
  static async changePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Invalidate all sessions for security
    await this.invalidateAllUserSessions(id);
  }

  /**
   * Convert User to AuthSession format
   */
  static userToAuthSession(
    user: User,
    requires2FA: boolean = false
  ): AuthSession {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
      isAuthenticated: true,
      requires2FA,
    };
  }
}
