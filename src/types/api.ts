export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  details?: string[]
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: HeadersInit
  body?: any
  cache?: RequestCache
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface RateLimitInfo {
  identifier: string
  attempts: number
  resetTime: Date
  maxAttempts: number
}

export interface ValidationError {
  field: string
  message: string
  code: string
}