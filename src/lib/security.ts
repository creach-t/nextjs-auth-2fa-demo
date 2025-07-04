import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { DatabaseService } from './db'
import { MESSAGES } from './constants'

/**
 * Security utilities for enhanced protection
 */
export class SecurityService {
  /**
   * Generate secure CSRF token
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Verify CSRF token
   */
  static verifyCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    )
  }

  /**
   * Hash IP address for privacy
   */
  static hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').substring(0, 16)
  }

  /**
   * Detect suspicious patterns in user agent
   */
  static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /requests/i,
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Validate request origin
   */
  static isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
    return allowedOrigins.includes(origin)
  }

  /**
   * Check for common SQL injection patterns
   */
  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\|)|(\*)|(%))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Check for XSS patterns
   */
  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|select|option)/gi,
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Sanitize input string
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .replace(/[<>"'&]/g, (match) => {
        const escapeMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        }
        return escapeMap[match] || match
      })
      .trim()
      .substring(0, 1000) // Limit length
  }

  /**
   * Advanced rate limiting with different tiers
   */
  static async checkAdvancedRateLimit(
    identifier: string,
    action: string,
    tier: 'strict' | 'normal' | 'relaxed' = 'normal'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date; tier: string }> {
    const limits = {
      strict: { maxAttempts: 3, windowMinutes: 30 },
      normal: { maxAttempts: 5, windowMinutes: 15 },
      relaxed: { maxAttempts: 10, windowMinutes: 5 },
    }
    
    const { maxAttempts, windowMinutes } = limits[tier]
    
    const result = await DatabaseService.checkRateLimit(
      identifier,
      action,
      maxAttempts,
      windowMinutes
    )
    
    return {
      allowed: result.allowed,
      remaining: Math.max(0, maxAttempts - result.attempts),
      resetTime: result.resetTime,
      tier,
    }
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    type: 'suspicious_activity' | 'blocked_request' | 'rate_limit_exceeded' | 'invalid_token' | 'csrf_violation',
    details: {
      userId?: string
      ipAddress?: string
      userAgent?: string
      details?: any
      severity?: 'low' | 'medium' | 'high' | 'critical'
    }
  ) {
    const severity = details.severity || 'medium'
    
    await DatabaseService.logAuditEvent({
      userId: details.userId,
      action: `security_${type}`,
      details: {
        type,
        severity,
        ...details.details,
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: false,
    })
    
    // In production, you might want to send alerts for high/critical events
    if (severity === 'high' || severity === 'critical') {
      console.warn(`🚨 Security Alert [${severity.toUpperCase()}]: ${type}`, details)
    }
  }

  /**
   * Generate session fingerprint
   */
  static generateSessionFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''
    
    const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
    
    return crypto
      .createHash('sha256')
      .update(fingerprint + process.env.JWT_SECRET)
      .digest('hex')
      .substring(0, 32)
  }

  /**
   * Validate session fingerprint
   */
  static validateSessionFingerprint(
    currentFingerprint: string,
    storedFingerprint: string
  ): boolean {
    return currentFingerprint === storedFingerprint
  }

  /**
   * Check if IP is from known VPN/Proxy/Tor (basic check)
   */
  static isSuspiciousIP(ip: string): boolean {
    // Basic check for private/local IPs
    const suspiciousPatterns = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ]
    
    // In production, you'd integrate with a proper IP reputation service
    return suspiciousPatterns.some(pattern => pattern.test(ip))
  }

  /**
   * Generate secure headers for responses
   */
  static getSecurityHeaders(): Record<string, string> {
    const nonce = crypto.randomBytes(16).toString('base64')
    
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      
      // HSTS (only in production)
      ...(process.env.NODE_ENV === 'production' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      }),
    }
  }

  /**
   * Apply security headers to response
   */
  static applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = this.getSecurityHeaders()
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}