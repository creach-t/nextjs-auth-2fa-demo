import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from './lib/auth'
import { PUBLIC_ROUTES, PROTECTED_ROUTES, API_ROUTES } from './lib/constants'

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value
  const refreshToken = request.cookies.get('refresh-token')?.value
  
  // Get client IP and User Agent for security logging
  const ipAddress = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname as any)) {
    // If user is already authenticated and tries to access auth pages, redirect to dashboard
    if ((pathname === '/login' || pathname === '/register') && token) {
      const isValidToken = AuthService.verifyAccessToken(token)
      if (isValidToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }
  
  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Public API routes (auth endpoints)
    const publicApiRoutes = [
      API_ROUTES.AUTH.REGISTER,
      API_ROUTES.AUTH.LOGIN,
      API_ROUTES.TWOFA.SEND,
      API_ROUTES.TWOFA.VERIFY,
    ]
    
    if (publicApiRoutes.includes(pathname as any)) {
      return NextResponse.next()
    }
    
    // Protected API routes
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token requis' },
        { status: 401 }
      )
    }
    
    // Verify token for protected API routes
    const payload = AuthService.verifyAccessToken(token)
    if (!payload) {
      // Try to refresh token
      if (refreshToken) {
        try {
          const refreshResult = await AuthService.refreshAccessToken(refreshToken)
          if (refreshResult) {
            // Set new token in response headers
            const response = NextResponse.next()
            response.cookies.set('auth-token', refreshResult.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 15 * 60, // 15 minutes
            })
            
            // Add user info to request headers for API routes
            response.headers.set('x-user-id', refreshResult.user.id)
            response.headers.set('x-user-email', refreshResult.user.email)
            
            return response
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
      }
      
      // Clear invalid tokens
      const response = NextResponse.json(
        { success: false, message: 'Token invalide ou expiré' },
        { status: 401 }
      )
      response.cookies.delete('auth-token')
      response.cookies.delete('refresh-token')
      return response
    }
    
    // Add user info to request headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-email', payload.email)
    response.headers.set('x-client-ip', ipAddress)
    response.headers.set('x-user-agent', userAgent)
    
    return response
  }
  
  // Handle protected page routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Verify token for protected pages
    const payload = AuthService.verifyAccessToken(token)
    if (!payload) {
      // Try to refresh token
      if (refreshToken) {
        try {
          const refreshResult = await AuthService.refreshAccessToken(refreshToken)
          if (refreshResult) {
            // Set new token and continue
            const response = NextResponse.next()
            response.cookies.set('auth-token', refreshResult.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 15 * 60, // 15 minutes
            })
            return response
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
      }
      
      // Clear invalid tokens and redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth-token')
      response.cookies.delete('refresh-token')
      return response
    }
    
    // Check if 2FA is required
    if (payload.requires2FA && pathname !== '/verify-2fa') {
      return NextResponse.redirect(new URL('/verify-2fa', request.url))
    }
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}