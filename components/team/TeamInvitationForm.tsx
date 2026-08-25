/**
 * Team invitation form for company admins.
 * It creates a pending invitation and shows the generated invite link.
 */
"use client";

import { useMemo, useState, type FormEvent } from "react";

import { AUTH_MESSAGES } from "@/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { createCompanyInvitation } from "@/services/company.service";
import type { CreateCompanyInvitationRequest } from "@/types/company";

type TeamInvitationFormProps = {
  companyId: string;
};

const ALLOWED_ROLES: CreateCompanyInvitationRequest["proposedRole"][] = ["admin", "member"];

export function TeamInvitationForm({ companyId }: TeamInvitationFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateCompanyInvitationRequest["proposedRole"]>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

  const canSubmit = useMemo(() => !isLoading, [isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(AUTH_MESSAGES.INVITE_EMAIL_REQUIRED);
      setSuccessMessage(null);
      return;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      setErrorMessage(AUTH_MESSAGES.INVITE_ROLE_REQUIRED);
      setSuccessMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setInvitationLink(null);

    const supabase = createClient();
    const result = await createCompanyInvitation(supabase, {
      companyId,
      invitedEmail: normalizedEmail,
      proposedRole: role,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error ?? AUTH_MESSAGES.INVITE_CREATE_FAILED);
      return;
    }

    setSuccessMessage(AUTH_MESSAGES.INVITE_CREATE_SUCCESS);
    setInvitationLink(result.invitationLink);
    setEmail("");
    setRole("member");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="invite-email" className="block text-sm font-medium text-text">
          Email du membre
        </label>
        <input
          id="invite-email"
          type="email"
          name="invite-email"
          placeholder="membre@entreprise.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="invite-role" className="block text-sm font-medium text-text">
          Role
        </label>
        <select
          id="invite-role"
          name="invite-role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as CreateCompanyInvitationRequest["proposedRole"])
          }
          disabled={isLoading}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {errorMessage ? <p className="text-sm text-error" role="alert">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

      {invitationLink ? (
        <div className="rounded-xl border border-border bg-background p-3 text-sm text-muted">
          <p className="font-medium text-text">{AUTH_MESSAGES.INVITE_LINK_NOTICE}</p>
          <p className="mt-2 break-all text-xs text-text">{invitationLink}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/25 sm:w-auto"
      >
        {isLoading ? AUTH_MESSAGES.SENDING_INVITE : AUTH_MESSAGES.CREATE_INVITE}
      </button>
    </form>
  );
}
