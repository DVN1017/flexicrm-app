/**
 * Authentication constants.
 * This file prevents hardcoded auth routes and user-facing messages in UI components.
 */
export const AUTH_ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  DASHBOARD: "/dashboard",
} as const;

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  PASSWORD_RESET_EMAIL_SENT:
    "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.",
  PASSWORD_UPDATED: "Mot de passe mis à jour avec succès.",
  PASSWORD_UPDATE_FAILED: "Le lien de réinitialisation est invalide ou expiré.",
  PASSWORDS_DO_NOT_MATCH: "Les mots de passe ne correspondent pas.",
  FORGOT_PASSWORD_REQUIRED: "Veuillez renseigner votre adresse email.",
  RESET_PASSWORD_REQUIRED: "Veuillez renseigner un nouveau mot de passe.",
  SIGN_OUT_FAILED: "La déconnexion a échoué. Veuillez réessayer.",
  SIGNING_IN: "Connexion...",
  SENDING_RESET_EMAIL: "Envoi en cours...",
  UPDATING_PASSWORD: "Mise à jour...",
  SIGNING_OUT: "Déconnexion...",
  SIGN_IN: "Se connecter",
  SEND_RESET_EMAIL: "Envoyer le lien",
  UPDATE_PASSWORD: "Mettre à jour",
  SIGN_OUT: "Se déconnecter",
} as const;
