/**
 * Analytics and tracking utilities
 */
export class AnalyticsService {
  private static isInitialized = false

  /**
   * Initialize analytics (placeholder for real implementation)
   */
  static init() {
    if (this.isInitialized || process.env.NODE_ENV === 'development') return
    
    // Initialize your analytics service here (Google Analytics, Plausible, etc.)
    this.isInitialized = true
    console.log('📊 Analytics initialized')
  }

  /**
   * Track page views
   */
  static trackPageView(path: string, title?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 Page view:', { path, title })
      return
    }
    
    // Example: gtag('config', 'GA_MEASUREMENT_ID', { page_path: path })
  }

  /**
   * Track authentication events
   */
  static trackAuthEvent(
    event: 'login' | 'register' | 'logout' | '2fa_success' | '2fa_failed',
    properties?: Record<string, any>
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth event:', { event, properties })
      return
    }
    
    // Example: gtag('event', event, properties)
  }

  /**
   * Track security events
   */
  static trackSecurityEvent(
    event: 'rate_limit' | 'suspicious_activity' | 'security_violation',
    severity: 'low' | 'medium' | 'high' | 'critical',
    properties?: Record<string, any>
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ Security event:', { event, severity, properties })
      return
    }
    
    // Track security events for monitoring
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(
    metric: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms'
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ Performance:', { metric, value, unit })
      return
    }
    
    // Track performance metrics
  }

  /**
   * Track user errors
   */
  static trackError(
    error: Error,
    context?: {
      userId?: string
      path?: string
      action?: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
    }
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error tracked:', { error: error.message, context })
      return
    }
    
    // Send to error tracking service (Sentry, etc.)
  }

  /**
   * Track custom events
   */
  static trackEvent(
    name: string,
    properties?: Record<string, any>
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Custom event:', { name, properties })
      return
    }
    
    // Track custom events
  }

  /**
   * Set user properties
   */
  static setUserProperties(properties: {
    userId?: string
    email?: string
    name?: string
    signupDate?: string
    plan?: string
  }) {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 User properties:', properties)
      return
    }
    
    // Set user properties for analytics
  }

  /**
   * Track feature usage
   */
  static trackFeature(
    feature: string,
    action: 'used' | 'enabled' | 'disabled',
    properties?: Record<string, any>
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Feature:', { feature, action, properties })
      return
    }
    
    // Track feature usage
  }

  /**
   * Track conversion events
   */
  static trackConversion(
    event: 'signup_completed' | 'login_successful' | '2fa_setup',
    value?: number,
    currency?: string
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Conversion:', { event, value, currency })
      return
    }
    
    // Track conversion events
  }

  /**
   * Flush analytics data
   */
  static flush() {
    if (process.env.NODE_ENV === 'development') return
    
    // Flush any pending analytics data
  }
}