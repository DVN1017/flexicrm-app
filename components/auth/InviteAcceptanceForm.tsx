/**
 * Invitation acceptance form.
 * It signs up the invited user with a fixed email and stores invitation token in user metadata.
 */
"use client";

import { useState, type FormEvent } from "react";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthInputField } from "@/components/ui/AuthInputField";
import { AuthTextLink } from "@/components/ui/AuthTextLink";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { createClient } from "@/lib/supabase/client";

type InviteAcceptanceFormProps = {
  token: string;
  companyName: string;
  invitedEmail: string;
  proposedRole: "admin" | "member";
};

export function InviteAcceptanceForm({
  token,
  companyName,
  invitedEmail,
  proposedRole,
}: InviteAcceptanceFormProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!password.trim()) {
      setErrorMessage(AUTH_MESSAGES.INVITE_PASSWORD_REQUIRED);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const passwordToSubmit = password;
    setPassword("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: invitedEmail,
      password: passwordToSubmit,
      options: {
        data: {
          invitation_token: token,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setShowVerifyEmail(true);
  };

  if (showVerifyEmail) {
    return (
      <VerifyEmailCard
        title="Verification requise"
        description={AUTH_MESSAGES.INVITE_ACCEPT_SUCCESS}
        ctaLabel="Retour a la connexion"
        ctaHref={AUTH_ROUTES.LOGIN}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Invitation</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">Rejoindre l&apos;entreprise</h2>
        <p className="mt-3 text-sm text-muted">
          Vous avez ete invite a rejoindre {companyName} avec le role {proposedRole}.
        </p>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthInputField
          id="invite-email"
          label="Email"
          type="email"
          name="invite-email"
          value={invitedEmail}
          disabled
          readOnly
        />

        <AuthInputField
          id="invite-password"
          label="Mot de passe"
          type="password"
          name="invite-password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />

        {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}

        <AuthActionButton type="submit" disabled={isLoading}>
          {isLoading ? AUTH_MESSAGES.ACCEPTING_INVITE : "Creer mon compte"}
        </AuthActionButton>
      </form>

      <div className="mt-6">
        <AuthTextLink href={AUTH_ROUTES.LOGIN}>J&apos;ai deja un compte</AuthTextLink>
      </div>
    </div>
  );
}
