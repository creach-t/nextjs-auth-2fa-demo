import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "./lib/constants";

// Types pour une meilleure sécurité
interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
  iss: string;
  aud: string;
  requires2FA?: boolean;
  iat: number;
}

interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security'?: string;
}

// Cache pour éviter les recalculs répétés
const routeCache = new Map<string, 'public' | 'protected' | 'api-public' | 'api-protected' | 'unknown'>();

/**
 * Détermine le type de route avec mise en cache
 */
function getRouteType(pathname: string): 'public' | 'protected' | 'api-public' | 'api-protected' | 'unknown' {
  if (routeCache.has(pathname)) {
    return routeCache.get(pathname)!;
  }

  let routeType: 'public' | 'protected' | 'api-public' | 'api-protected' | 'unknown';

  if (PUBLIC_ROUTES.includes(pathname as any)) {
    routeType = 'public';
  } else if (pathname.startsWith("/api/")) {
    const publicApiRoutes = [
      API_ROUTES.AUTH.REGISTER,
      API_ROUTES.AUTH.LOGIN,
      API_ROUTES.AUTH.REFRESH,
      API_ROUTES.TWOFA.SEND,
      API_ROUTES.TWOFA.VERIFY,
      '/api/health',
      '/api/maintenance'
    ];

    routeType = publicApiRoutes.includes(pathname as any) ? 'api-public' : 'api-protected';
  } else if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    routeType = 'protected';
  } else {
    routeType = 'unknown';
  }

  // Cache seulement en production pour éviter les fuites mémoire en dev
  if (process.env.NODE_ENV === 'production') {
    routeCache.set(pathname, routeType);
  }

  return routeType;
}

/**
 * Validation sécurisée du token JWT (version basique pour middleware)
 * ⚠️ IMPORTANT: Cette validation est basique et ne vérifie pas la signature!
 * La vérification complète avec signature doit être faite dans les API routes.
 */
function validateTokenBasic(token: string): TokenPayload | null {
  try {
    // Vérification du format JWT basique
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [header, payloadEncoded, signature] = parts;

    // Vérification que toutes les parties sont présentes
    if (!header || !payloadEncoded || !signature) {
      return null;
    }

    // Décoder le payload de façon sécurisée
    let payload: any;
    try {
      // Ajouter le padding manquant si nécessaire
      const paddedPayload = payloadEncoded.replace(/-/g, '+').replace(/_/g, '/');
      const padding = paddedPayload.length % 4;
      const finalPayload = padding ? paddedPayload + '='.repeat(4 - padding) : paddedPayload;

      payload = JSON.parse(atob(finalPayload));
    } catch (decodeError) {
      return null;
    }

    // Validation du schéma du payload
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    // Vérifications des champs obligatoires
    if (!payload.userId || !payload.email || !payload.exp || !payload.iss || !payload.aud) {
      return null;
    }

    // Validation des types
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
      return null;
    }

    if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
      return null;
    }

    // Validation de l'email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      return null;
    }

    // Vérification de l'expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    // Vérification que le token n'est pas du futur (clock skew protection)
    if (payload.iat > now + 60) { // 60 secondes de tolérance
      return null;
    }

    // Vérification issuer et audience
    if (payload.iss !== "nextjs-auth-2fa-demo" || payload.aud !== "nextjs-auth-2fa-demo-users") {
      return null;
    }

    return payload as TokenPayload;
  } catch (error) {
    // Ne pas logger les erreurs en production pour éviter le spam
    if (process.env.NODE_ENV === 'development') {
      console.warn("Token validation error:", error);
    }
    return null;
  }
}

/**
 * Obtenir l'adresse IP du client de façon sécurisée
 */
function getClientIP(request: NextRequest): string {
  // En production, faire attention aux headers qui peuvent être spoofés
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const connectingIP = request.headers.get("cf-connecting-ip"); // Cloudflare

  return (
    connectingIP ||
    realIP ||
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    request.ip ||
    "unknown"
  );
}

/**
 * Ajouter les headers de sécurité
 */
function addSecurityHeaders(response: NextResponse): void {
  const securityHeaders: SecurityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };

  // HSTS seulement en production et HTTPS
  if (process.env.NODE_ENV === 'production') {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Appliquer tous les headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });
}

/**
 * Créer une réponse d'erreur JSON standardisée
 */
function createErrorResponse(message: string, status: number, additionalData?: object): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...additionalData
    },
    { status }
  );

  addSecurityHeaders(response);
  return response;
}

/**
 * Créer une réponse de redirection sécurisée
 */
function createRedirectResponse(url: string, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL(url, request.url));
  addSecurityHeaders(response);
  return response;
}

/**
 * Middleware principal d'authentification et de protection des routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Obtenir les informations du client pour le logging de sécurité
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Déterminer le type de route
  const routeType = getRouteType(pathname);

  try {
    switch (routeType) {
      case 'public':
        return handlePublicRoute(request, token, pathname);

      case 'api-public':
        return handlePublicApiRoute(request);

      case 'api-protected':
        return handleProtectedApiRoute(request, token, ipAddress, userAgent);

      case 'protected':
        return handleProtectedRoute(request, token, pathname);

      default:
        // Route inconnue - laisser passer avec headers de sécurité
        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
    }
  } catch (error) {
    // Gestion d'erreur globale
    console.error("Middleware error:", error);
    return createErrorResponse("Erreur interne du serveur", 500);
  }
}

/**
 * Gestion des routes publiques
 */
function handlePublicRoute(request: NextRequest, token: string | undefined, pathname: string): NextResponse {
  // Si l'utilisateur est déjà connecté et essaie d'accéder aux pages d'auth, rediriger vers dashboard
  if ((pathname === "/login" || pathname === "/register") && token) {
    const payload = validateTokenBasic(token);
    if (payload) {
      return createRedirectResponse("/dashboard", request);
    }
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

/**
 * Gestion des routes API publiques
 */
function handlePublicApiRoute(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

/**
 * Gestion des routes API protégées
 */
function handleProtectedApiRoute(
  request: NextRequest,
  token: string | undefined,
  ipAddress: string,
  userAgent: string
): NextResponse {
  if (!token) {
    return createErrorResponse("Token d'authentification requis", 401);
  }

  const payload = validateTokenBasic(token);
  if (!payload) {
    return createErrorResponse("Token invalide ou expiré", 401);
  }

  // Ajouter les informations utilisateur aux headers pour les API routes
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.userId);
  response.headers.set("x-user-email", payload.email);
  response.headers.set("x-client-ip", ipAddress);
  response.headers.set("x-user-agent", userAgent);

  addSecurityHeaders(response);
  return response;
}

/**
 * Gestion des routes de pages protégées
 */
function handleProtectedRoute(request: NextRequest, token: string | undefined, pathname: string): NextResponse {
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return createRedirectResponse(loginUrl.toString(), request);
  }

  const payload = validateTokenBasic(token);
  if (!payload) {
    // Nettoyer les cookies invalides et rediriger
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = createRedirectResponse(loginUrl.toString(), request);
    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    return response;
  }

  // Vérifier si 2FA est requis
  if (payload.requires2FA && pathname !== "/verify-2fa") {
    return createRedirectResponse("/verify-2fa", request);
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

// Configuration du matcher avec optimisations
export const config = {
  matcher: [
    /*
     * Matcher optimisé pour exclure :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico, robots.txt, sitemap.xml
     * - assets statiques (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$).*)",
  ],
};