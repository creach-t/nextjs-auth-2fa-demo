import { NextRequest, NextResponse } from "next/server";
import { API_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "./lib/constants";

// Fonction simple pour vérifier le token dans le middleware
function checkTokenBasic(token: string) {
  try {
    const [headerEncoded, payloadEncoded, signature] = token.split(".");

    if (!headerEncoded || !payloadEncoded || !signature) {
      return null;
    }

    // Décoder seulement le payload
    const payload = JSON.parse(atob(payloadEncoded));

    // Vérifications basiques
    const now = Math.floor(Date.now() / 1000);

    // Vérifier l'expiration
    if (payload.exp && payload.exp < now) {
      console.log("❌ Token expired");
      return null;
    }

    // Vérifier que les champs essentiels sont présents
    if (!payload.userId || !payload.email) {
      console.log("❌ Invalid token payload");
      return null;
    }

    // Vérifier issuer et audience (optionnel)
    if (
      payload.iss !== "nextjs-auth-2fa-demo" ||
      payload.aud !== "nextjs-auth-2fa-demo-users"
    ) {
      console.log("❌ Invalid issuer or audience");
      return null;
    }

    console.log("✅ Token basic validation successful");
    return payload;
  } catch (error) {
    console.log("❌ Token parsing error:", error.message);
    return null;
  }
}

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Get client IP and User Agent for security logging
  const ipAddress =
    request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname as any)) {
    // If user is already authenticated and tries to access auth pages, redirect to dashboard
    if ((pathname === "/login" || pathname === "/register") && token) {
      const payload = checkTokenBasic(token);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    // Public API routes (auth endpoints)
    const publicApiRoutes = [
      API_ROUTES.AUTH.REGISTER,
      API_ROUTES.AUTH.LOGIN,
      API_ROUTES.AUTH.REFRESH,
      API_ROUTES.TWOFA.SEND,
      API_ROUTES.TWOFA.VERIFY,
    ];

    if (publicApiRoutes.includes(pathname as any)) {
      return NextResponse.next();
    }

    // Protected API routes - La vérification complète se fait dans les API routes elles-mêmes
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token requis" },
        { status: 401 }
      );
    }

    // Vérification basique seulement
    const payload = checkTokenBasic(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // Add user info to request headers for API routes
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId);
    response.headers.set("x-user-email", payload.email);
    response.headers.set("x-client-ip", ipAddress);
    response.headers.set("x-user-agent", userAgent);

    return response;
  }

  // Handle protected page routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!token) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log("🔍 Debug token verification:");
    console.log("Token present:", !!token);

    // Vérification basique du token
    const payload = checkTokenBasic(token);

    console.log("Payload valid:", !!payload);

    if (!payload) {
      console.log(
        "❌ Token verification failed - clearing cookies and redirecting"
      );
      // Clear invalid tokens and redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth-token");
      response.cookies.delete("refresh-token");
      return response;
    }

    console.log("✅ Token verification successful");

    // Check if 2FA is required
    if (payload.requires2FA && pathname !== "/verify-2fa") {
      console.log("🔒 2FA required, redirecting to verify-2fa");
      return NextResponse.redirect(new URL("/verify-2fa", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
