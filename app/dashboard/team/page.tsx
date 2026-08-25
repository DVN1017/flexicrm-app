/**
 * Team management page.
 * Owners/admins can review members and create invitations from this route.
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import { TeamInvitationForm } from "@/components/team/TeamInvitationForm";
import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getCurrentUserCompanyAccess,
  listCurrentCompanyMembers,
  listCurrentCompanyPendingInvitations,
} from "@/services/company.service";

export default async function TeamPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(AUTH_ROUTES.LOGIN);
  }

  const companyAccess = await getCurrentUserCompanyAccess(supabase, user.id);

  if (!companyAccess) {
    redirect(AUTH_ROUTES.CREATE_COMPANY);
  }

  if (companyAccess.role === "member") {
    redirect(AUTH_ROUTES.DASHBOARD);
  }

  const [members, pendingInvitations] = await Promise.all([
    listCurrentCompanyMembers(supabase, {
      companyId: companyAccess.companyId,
      currentUserId: user.id,
      currentUserEmail: user.email ?? null,
      currentUserRole: companyAccess.role,
    }),
    listCurrentCompanyPendingInvitations(supabase),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-surface p-6 shadow-soft sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Equipe</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">Membres et invitations</h1>
            <p className="mt-2 text-sm text-muted">Entreprise: {companyAccess.companyName}</p>
          </div>
          <Link className="text-sm font-medium text-primary hover:underline" href={AUTH_ROUTES.DASHBOARD}>
            Retour dashboard
          </Link>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-background p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-text">Inviter un membre</h2>
          <p className="mt-1 text-sm text-muted">Roles autorises: admin, member.</p>
          <div className="mt-4">
            <TeamInvitationForm companyId={companyAccess.companyId} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text">Membres actuels</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-muted" colSpan={3}>
                      Aucun membre trouve.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.userId}>
                      <td className="px-4 py-3 text-text">{member.email}</td>
                      <td className="px-4 py-3 text-text">{member.role}</td>
                      <td className="px-4 py-3 text-text">{member.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text">Invitations en attente</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingInvitations.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3 text-muted" colSpan={3}>
                      Aucune invitation en attente.
                    </td>
                  </tr>
                ) : (
                  pendingInvitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3 text-text">{invitation.invitedEmail}</td>
                      <td className="px-4 py-3 text-text">{invitation.proposedRole}</td>
                      <td className="px-4 py-3 text-text">
                        {new Date(invitation.expiresAt).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
