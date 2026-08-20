/**
 * Presentation-only form for the forgot-password screen.
 * It captures only visual structure for Sprint design validation and intentionally excludes submit logic.
 */
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthInputField } from "@/components/ui/AuthInputField";
import { AuthTextLink } from "@/components/ui/AuthTextLink";

export function ForgotPasswordForm() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Sécurité</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
          Mot de passe oublié
        </h2>
        <p className="mt-3 text-sm text-muted">
          Saisissez votre adresse email pour recevoir les instructions de réinitialisation.
        </p>
      </div>

      <form className="space-y-5" noValidate>
        <AuthInputField
          id="email"
          label="Email"
          type="email"
          name="email"
          placeholder="nom@entreprise.com"
          autoComplete="email"
        />

        <AuthActionButton type="button">Envoyer le lien</AuthActionButton>
      </form>

      <div className="mt-6">
        <AuthTextLink href="/login">Retour à la connexion</AuthTextLink>
      </div>
    </div>
  );
}
