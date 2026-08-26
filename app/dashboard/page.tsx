/**
 * Dashboard landing page for authenticated users.
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_MESSAGES, AUTH_ROUTES } from "@/constants/auth";
import { DashboardSignOutButton } from "@/components/auth/DashboardSignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const companyAccess = await getCurrentUserCompanyAccess(supabase, user.id);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-surface p-6 shadow-soft sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">FlexiCRM</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">Tableau de bord</h1>
        <p className="mt-3 text-sm text-muted">Centre de pilotage de votre entreprise.</p>

        <div className="mt-8 rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Entreprise</p>
          <p className="mt-2 text-base font-medium text-text">{companyAccess?.companyName ?? "Entreprise non configuree"}</p>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Utilisateur connecté</p>
          <p className="mt-2 text-base font-medium text-text">{user.email}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/conversations" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
            Ouvrir les conversations
          </Link>
          <Link href="/dashboard/clients" className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-text hover:bg-background">
            Ouvrir les clients
          </Link>
          {companyAccess && companyAccess.role !== "member" ? (
            <Link className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-text hover:bg-background" href={AUTH_ROUTES.DASHBOARD_TEAM}>
              {AUTH_MESSAGES.GO_TO_TEAM}
            </Link>
          ) : null}
          <DashboardSignOutButton />
        </div>
      </section>
    </main>
  );
}
