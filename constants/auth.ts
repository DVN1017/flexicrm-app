/**
 * Authentication constants.
 * This file prevents hardcoded auth routes and user-facing messages in UI components.
 */
export const AUTH_ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
} as const;

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  SIGNING_IN: "Connexion...",
  SIGN_IN: "Se connecter",
} as const;
