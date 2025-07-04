export interface User {
  id: string
  email: string
  name?: string
  password?: string // Only included in certain contexts
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name?: string
  }
  isAuthenticated: boolean
  requires2FA: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface TwoFACode {
  id: string
  userId: string
  code: string
  expiresAt: Date
  attempts: number
  createdAt: Date
}

export interface VerifyTwoFARequest {
  email: string
  code: string
}

export interface JWTPayload {
  userId: string
  email: string
  name?: string
  requires2FA?: boolean
  iat?: number
  exp?: number
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    name?: string
  }
  requires2FA?: boolean
  token?: string
  refreshToken?: string
}

export interface ApiError {
  success: false
  message: string
  error?: string
  details?: string[]
}