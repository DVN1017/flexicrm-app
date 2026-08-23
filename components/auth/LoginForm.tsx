/**
 * LoginForm is the interactive authentication form for login.
 * It handles field state and delegates sign-in to the auth service layer, keeping
 * Supabase access out of the presentation logic.
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { AuthTextLink } from "@/components/ui/AuthTextLink";
import { createClient } from "@/lib/supabase/client";
import { signInWithPassword } from "@/services/auth.service";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const passwordToSubmit = password;

    // Clear password state before sending request to avoid keeping it in memory after submission.
    setPassword("");

    const supabase = createClient();
    const result = await signInWithPassword(supabase, {
      email: normalizedEmail,
      password: passwordToSubmit,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error ?? AUTH_MESSAGES.INVALID_CREDENTIALS);
      return;
    }

    router.push(AUTH_ROUTES.DASHBOARD);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Connexion</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">Accédez à votre espace</h2>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="nom@entreprise.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-text">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="text-right">
            <AuthTextLink href={AUTH_ROUTES.FORGOT_PASSWORD}>Mot de passe oublié ?</AuthTextLink>
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          {isLoading ? AUTH_MESSAGES.SIGNING_IN : AUTH_MESSAGES.SIGN_IN}
        </button>

        <div className="text-center">
          <AuthTextLink href={AUTH_ROUTES.CREATE_COMPANY}>Creer mon entreprise</AuthTextLink>
        </div>
      </form>
    </div>
  );
}
