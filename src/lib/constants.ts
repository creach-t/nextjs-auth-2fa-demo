// Application constants
export const APP_NAME = "Next.js Auth 2FA Demo";
export const APP_DESCRIPTION =
  "Démonstration complète d'un système d'authentification Next.js avec authentification à deux facteurs (A2F) par email";

// Authentication constants
export const AUTH_CONSTANTS = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,

  // JWT token expiration
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",

  // Session duration
  SESSION_DURATION_DAYS: 7,

  // 2FA settings
  TWOFA_CODE_LENGTH: 6,
  TWOFA_CODE_EXPIRY_MINUTES: 5,
  TWOFA_MAX_ATTEMPTS: 3,

  // Rate limiting
  RATE_LIMIT: {
    LOGIN: {
      MAX_ATTEMPTS: 5,
      WINDOW_MINUTES: 15,
    },
    REGISTER: {
      MAX_ATTEMPTS: 3,
      WINDOW_MINUTES: 60,
    },
    TWOFA: {
      MAX_ATTEMPTS: 3,
      WINDOW_MINUTES: 15,
    },
    PASSWORD_RESET: {
      MAX_ATTEMPTS: 3,
      WINDOW_MINUTES: 60,
    },
  },
} as const;

// Email templates constants
export const EMAIL_CONSTANTS = {
  SUBJECTS: {
    TWOFA_CODE: "Code de vérification - Next.js Auth Demo",
    WELCOME: "Bienvenue sur Next.js Auth Demo",
    PASSWORD_RESET: "Réinitialisation de mot de passe",
  },
  FROM_NAME: "Next.js Auth Demo",
} as const;

// API response messages
export const MESSAGES = {
  SUCCESS: {
    REGISTER: "Compte créé avec succès",
    LOGIN: "Connexion réussie",
    LOGOUT: "Déconnexion réussie",
    TWOFA_SENT: "Code de vérification envoyé",
    TWOFA_VERIFIED: "Code vérifié avec succès",
    PASSWORD_CHANGED: "Mot de passe modifié avec succès",
    PROFILE_UPDATED: "Profil mis à jour avec succès",
  },
  ERROR: {
    INTERNAL: "Erreur interne du serveur",
    VALIDATION: "Données de validation invalides",
    UNAUTHORIZED: "Non autorisé",
    FORBIDDEN: "Accès interdit",
    NOT_FOUND: "Ressource non trouvée",
    RATE_LIMIT: "Trop de tentatives. Veuillez réessayer plus tard",

    // Auth specific
    INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
    USER_EXISTS: "Un utilisateur avec cet email existe déjà",
    USER_NOT_FOUND: "Utilisateur non trouvé",
    INVALID_TOKEN: "Token invalide ou expiré",
    INVALID_SESSION: "Session invalide ou expirée",

    // 2FA specific
    INVALID_CODE: "Code de vérification invalide",
    CODE_EXPIRED: "Code de vérification expiré",
    CODE_MAX_ATTEMPTS: "Nombre maximum de tentatives atteint",

    // Email specific
    EMAIL_SEND_FAILED: "Échec de l'envoi de l'email",
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

function getEnv() {
  if (typeof window !== "undefined") {
    throw new Error("ENV can only be accessed on server side");
  }

  const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587"),
    EMAIL_USER: process.env.EMAIL_USER!,
    EMAIL_PASS: process.env.EMAIL_PASS!,
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER!,
    TWOFA_CODE_EXPIRY_MINUTES: parseInt(
      process.env.TWOFA_CODE_EXPIRY_MINUTES || "5"
    ),
    TWOFA_MAX_ATTEMPTS: parseInt(process.env.TWOFA_MAX_ATTEMPTS || "3"),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  };

  // Validate required environment variables (server-side only)
  const REQUIRED_ENV_VARS = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
  ] as const;
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return env;
}

export const ENV = new Proxy({} as any, {
  get(target, prop) {
    return getEnv()[prop as keyof ReturnType<typeof getEnv>];
  },
});

// API routes
export const API_ROUTES = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
  },
  TWOFA: {
    SEND: "/api/2fa/send-code",
    VERIFY: "/api/2fa/verify-code",
  },
} as const;

// Public routes (no authentication required)
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/verify-2fa",
  "/forgot-password",
  "/reset-password",
] as const;

// Protected routes (authentication required)
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
] as const;
