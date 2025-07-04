/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceService {
  /**
   * Measure function execution time
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return { result, duration }
  }

  /**
   * Measure synchronous function execution time
   */
  static measure<T>(name: string, fn: () => T): { result: T; duration: number } {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
    }
    
    return { result, duration }
  }

  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0
    
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        func(...args)
      }
    }
  }

  /**
   * Create a memoized version of a function
   */
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = func(...args)
      cache.set(key, result)
      
      return result
    }) as T
  }

  /**
   * Log Web Vitals for monitoring
   */
  static logWebVitals(metric: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital:', metric)
    }
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: gtag('event', metric.name, { value: metric.value })
    }
  }

  /**
   * Optimize image loading with lazy loading and WebP support
   */
  static getOptimizedImageProps(src: string, alt: string) {
    return {
      src,
      alt,
      loading: 'lazy' as const,
      decoding: 'async' as const,
      style: { contentVisibility: 'auto' },
    }
  }

  /**
   * Check if reduced motion is preferred
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Get connection speed info
   */
  static getConnectionInfo() {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return { effectiveType: 'unknown', downlink: 0 }
    }
    
    const connection = (navigator as any).connection
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
    }
  }

  /**
   * Preload critical resources
   */
  static preloadResource(href: string, as: string, type?: string) {
    if (typeof document === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    
    document.head.appendChild(link)
  }

  /**
   * Monitor memory usage (development only)
   */
  static monitorMemory() {
    if (process.env.NODE_ENV !== 'development') return
    if (typeof window === 'undefined' || !('performance' in window)) return
    
    const memory = (performance as any).memory
    if (!memory) return
    
    console.log('🧠 Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    })
  }
}