/**
 * Authentication constants.
 * This file prevents hardcoded auth routes and user-facing messages in UI components.
 */
export const AUTH_ROUTES = {
  LOGIN: "/login",
  LOGOUT: "/logout",
  CREATE_COMPANY: "/create-company",
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
  CREATE_COMPANY_NAME_REQUIRED: "Veuillez renseigner le nom de l'entreprise.",
  CREATE_COMPANY_EMAIL_REQUIRED: "Veuillez renseigner une adresse email.",
  CREATE_COMPANY_PASSWORD_REQUIRED: "Veuillez renseigner un mot de passe.",
  CREATE_COMPANY_EMAIL_ALREADY_USED: "Cet email est deja utilise.",
  CREATE_COMPANY_FAILED:
    "La creation de l'entreprise a echoue. Veuillez reessayer ou contacter le support.",
  CREATE_COMPANY_VERIFY_EMAIL:
    "Verifiez votre email pour confirmer votre compte avant de finaliser la creation de l'entreprise.",
  CREATE_COMPANY_SUCCESS: "Entreprise creee avec succes.",
  SIGN_OUT_FAILED: "La déconnexion a échoué. Veuillez réessayer.",
  SIGNING_IN: "Connexion...",
  SIGNING_UP: "Inscription en cours...",
  CREATING_COMPANY: "Creation en cours...",
  SENDING_RESET_EMAIL: "Envoi en cours...",
  UPDATING_PASSWORD: "Mise à jour...",
  SIGNING_OUT: "Déconnexion...",
  SIGN_IN: "Se connecter",
  SIGN_UP: "Creer le compte",
  CREATE_COMPANY: "Creer mon entreprise",
  SEND_RESET_EMAIL: "Envoyer le lien",
  UPDATE_PASSWORD: "Mettre à jour",
  SIGN_OUT: "Se déconnecter",
} as const;
