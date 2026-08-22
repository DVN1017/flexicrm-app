/**
 * Interactive reset-password form.
 * It validates matching passwords client-side and delegates update logic to the auth service layer.
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthInputField } from "@/components/ui/AuthInputField";
import { AuthTextLink } from "@/components/ui/AuthTextLink";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/services/auth.service";

export function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage(AUTH_MESSAGES.RESET_PASSWORD_REQUIRED);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(AUTH_MESSAGES.PASSWORDS_DO_NOT_MATCH);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const passwordToSubmit = password;
    setPassword("");
    setConfirmPassword("");

    const supabase = createClient();
    const result = await updatePassword(supabase, {
      password: passwordToSubmit,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error ?? AUTH_MESSAGES.PASSWORD_UPDATE_FAILED);
      return;
    }

    router.push(AUTH_ROUTES.LOGIN);
  };

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

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthInputField
          id="password"
          label="Nouveau mot de passe"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />

        <AuthInputField
          id="confirm-password"
          label="Confirmer le mot de passe"
          type="password"
          name="confirm-password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isLoading}
        />

        {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}

        <AuthActionButton type="submit" disabled={isLoading}>
          {isLoading ? AUTH_MESSAGES.UPDATING_PASSWORD : AUTH_MESSAGES.UPDATE_PASSWORD}
        </AuthActionButton>
      </form>

      <div className="mt-6">
        <AuthTextLink href={AUTH_ROUTES.LOGIN}>Retour à la connexion</AuthTextLink>
      </div>
    </div>
  );
}
