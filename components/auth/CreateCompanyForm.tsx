/**
 * Company onboarding form.
 * It supports two phases: account sign-up (email confirmation required) and authenticated
 * company bootstrap once a valid session exists.
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { AuthActionButton } from "@/components/ui/AuthActionButton";
import { AuthInputField } from "@/components/ui/AuthInputField";
import { AuthTextLink } from "@/components/ui/AuthTextLink";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { createClient } from "@/lib/supabase/client";
import {
  bootstrapCompanyForCurrentUser,
  signUpCompanyOwnerAccount,
} from "@/services/company.service";

type CreateCompanyFormProps = {
  isAuthenticated: boolean;
};

export function CreateCompanyForm({ isAuthenticated }: CreateCompanyFormProps) {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const handleBootstrapCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const normalizedCompanyName = companyName.trim();

    if (!normalizedCompanyName) {
      setErrorMessage(AUTH_MESSAGES.CREATE_COMPANY_NAME_REQUIRED);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const supabase = createClient();
    const result = await bootstrapCompanyForCurrentUser(supabase, {
      companyName: normalizedCompanyName,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error ?? AUTH_MESSAGES.CREATE_COMPANY_FAILED);
      return;
    }

    router.push(AUTH_ROUTES.DASHBOARD);
    router.refresh();
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(AUTH_MESSAGES.CREATE_COMPANY_EMAIL_REQUIRED);
      return;
    }

    if (!password.trim()) {
      setErrorMessage(AUTH_MESSAGES.CREATE_COMPANY_PASSWORD_REQUIRED);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const passwordToSubmit = password;
    setPassword("");

    const supabase = createClient();
    const result = await signUpCompanyOwnerAccount(supabase, {
      email: normalizedEmail,
      password: passwordToSubmit,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error ?? AUTH_MESSAGES.CREATE_COMPANY_FAILED);
      return;
    }

    setShowVerifyEmail(true);
  };

  if (!isAuthenticated && showVerifyEmail) {
    return (
      <VerifyEmailCard
        title="Verifiez votre email"
        description={AUTH_MESSAGES.CREATE_COMPANY_VERIFY_EMAIL}
        ctaLabel="Retour a la connexion"
        ctaHref={AUTH_ROUTES.LOGIN}
      />
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Entreprise</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
            Finaliser votre espace
          </h2>
          <p className="mt-3 text-sm text-muted">
            Votre compte est confirme. Creez maintenant votre entreprise pour acceder au dashboard.
          </p>
        </div>

        <form className="space-y-5" noValidate onSubmit={handleBootstrapCompany}>
          <AuthInputField
            id="company-name"
            label="Nom de l&apos;entreprise"
            type="text"
            name="company-name"
            placeholder="Ex: Flexi Travel"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            disabled={isLoading}
          />

          {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}

          <AuthActionButton type="submit" disabled={isLoading}>
            {isLoading ? AUTH_MESSAGES.CREATING_COMPANY : AUTH_MESSAGES.CREATE_COMPANY}
          </AuthActionButton>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Entreprise</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">Creer votre compte</h2>
        <p className="mt-3 text-sm text-muted">
          Inscrivez le proprietaire puis confirmez votre email avant de creer l&apos;entreprise.
        </p>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSignUp}>
        <AuthInputField
          id="email"
          label="Email"
          type="email"
          name="email"
          placeholder="admin@entreprise.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
        />

        <AuthInputField
          id="password"
          label="Mot de passe"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />

        {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}

        <AuthActionButton type="submit" disabled={isLoading}>
          {isLoading ? AUTH_MESSAGES.SIGNING_UP : AUTH_MESSAGES.SIGN_UP}
        </AuthActionButton>
      </form>

      <div className="mt-6">
        <AuthTextLink href={AUTH_ROUTES.LOGIN}>J&apos;ai deja un compte</AuthTextLink>
      </div>
    </div>
  );
}
