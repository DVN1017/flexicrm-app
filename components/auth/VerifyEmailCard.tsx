/**
 * Presentation-only confirmation screen for email verification.
 * It communicates next steps after signup and keeps the same visual language as other auth pages.
 */
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthTextLink } from "@/components/ui/AuthTextLink";

export function VerifyEmailCard() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Vérification</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
          Vérifiez votre boîte mail
        </h2>
        <p className="mt-3 text-sm text-muted">
          Un message de confirmation vient d’être envoyé. Ouvrez votre email puis cliquez sur le lien
          pour activer votre compte.
        </p>
      </div>

      <div className="space-y-5">
        <AuthActionButton type="button">Renvoyer l’email</AuthActionButton>
        <AuthTextLink href="/login">Retour à la connexion</AuthTextLink>
      </div>
    </div>
  );
}
