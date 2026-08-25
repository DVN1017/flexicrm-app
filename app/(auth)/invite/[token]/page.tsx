/**
 * Invitation acceptance route.
 * Validates invitation token and allows invited user to create an account.
 */
import { AUTH_MESSAGES } from "@/constants/auth";
import { InviteAcceptanceForm } from "@/components/auth/InviteAcceptanceForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getInvitationContextByToken } from "@/services/company.service";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

function InvitationErrorCard({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Invitation</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">Lien indisponible</h2>
        <p className="mt-3 text-sm text-error">{message}</p>
      </div>
    </div>
  );
}

export default async function InviteTokenPage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();

  const invitation = await getInvitationContextByToken(supabase, token);

  if (!invitation) {
    return <InvitationErrorCard message={AUTH_MESSAGES.INVITE_INVALID_TOKEN} />;
  }

  if (invitation.status === "accepted") {
    return <InvitationErrorCard message={AUTH_MESSAGES.INVITE_ALREADY_USED} />;
  }

  if (invitation.status === "expired" || !invitation.isValid) {
    return <InvitationErrorCard message={AUTH_MESSAGES.INVITE_EXPIRED_TOKEN} />;
  }

  return (
    <InviteAcceptanceForm
      token={token}
      companyName={invitation.companyName}
      invitedEmail={invitation.invitedEmail}
      proposedRole={invitation.proposedRole}
    />
  );
}
