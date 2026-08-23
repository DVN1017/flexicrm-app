/**
 * Presentation-only confirmation screen for email verification.
 * It communicates next steps after signup and keeps the same visual language as other auth pages.
 */
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthTextLink } from "@/components/ui/AuthTextLink";

type VerifyEmailCardProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function VerifyEmailCard({
  title = "Verifiez votre boite mail",
  description =
    "Un message de confirmation vient d'etre envoye. Ouvrez votre email puis cliquez sur le lien pour activer votre compte.",
  ctaLabel = "Retour a la connexion",
  ctaHref = "/login",
}: VerifyEmailCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Vérification</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{title}</h2>
        <p className="mt-3 text-sm text-muted">{description}</p>
      </div>

      <div className="space-y-5">
        <AuthActionButton type="button">Renvoyer l’email</AuthActionButton>
        <AuthTextLink href={ctaHref}>{ctaLabel}</AuthTextLink>
      </div>
    </div>
  );
}
