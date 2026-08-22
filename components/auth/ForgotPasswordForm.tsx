/**
 * Interactive forgot-password form.
 * It delegates reset-email behavior to the auth service and keeps visual consistency with other auth screens.
 */
"use client";

import { useState, type FormEvent } from "react";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthInputField } from "@/components/ui/AuthInputField";
import { AuthTextLink } from "@/components/ui/AuthTextLink";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/services/auth.service";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(AUTH_MESSAGES.FORGOT_PASSWORD_REQUIRED);
      setSuccessMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();
    const resetRedirectTo = `${window.location.origin}${AUTH_ROUTES.RESET_PASSWORD}`;
    const result = await requestPasswordReset(supabase, {
      email: normalizedEmail,
      redirectTo: resetRedirectTo,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error ?? AUTH_MESSAGES.PASSWORD_UPDATE_FAILED);
      return;
    }

    setSuccessMessage(AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT);
  };

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

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthInputField
          id="email"
          label="Email"
          type="email"
          name="email"
          placeholder="nom@entreprise.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
        />

        {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}

        {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

        <AuthActionButton type="submit" disabled={isLoading}>
          {isLoading ? AUTH_MESSAGES.SENDING_RESET_EMAIL : AUTH_MESSAGES.SEND_RESET_EMAIL}
        </AuthActionButton>
      </form>

      <div className="mt-6">
        <AuthTextLink href={AUTH_ROUTES.LOGIN}>Retour à la connexion</AuthTextLink>
      </div>
    </div>
  );
}
