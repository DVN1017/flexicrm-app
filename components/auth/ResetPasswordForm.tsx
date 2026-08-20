/**
 * Presentation-only form for password reset.
 * This component intentionally provides no submission behavior and focuses only on visual consistency.
 */
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthInputField } from "@/components/ui/AuthInputField";
import { AuthTextLink } from "@/components/ui/AuthTextLink";

export function ResetPasswordForm() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Sécurité</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
          Créer un nouveau mot de passe
        </h2>
        <p className="mt-3 text-sm text-muted">
          Choisissez un mot de passe robuste pour protéger votre espace FlexiCRM.
        </p>
      </div>

      <form className="space-y-5" noValidate>
        <AuthInputField
          id="password"
          label="Nouveau mot de passe"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <AuthInputField
          id="confirm-password"
          label="Confirmer le mot de passe"
          type="password"
          name="confirm-password"
          placeholder="••••••••"
          autoComplete="new-password"
        />

        <AuthActionButton type="button">Mettre à jour</AuthActionButton>
      </form>

      <div className="mt-6">
        <AuthTextLink href="/login">Retour à la connexion</AuthTextLink>
      </div>
    </div>
  );
}
