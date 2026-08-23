/**
 * Dashboard landing page for authenticated users.
 * This server route verifies the active Supabase session before rendering any business content.
 */
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { DashboardSignOutButton } from "@/components/auth/DashboardSignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(AUTH_ROUTES.LOGIN);
  }

  const companyAccess = await getCurrentUserCompanyAccess(supabase, user.id);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-surface p-6 shadow-soft sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">FlexiCRM</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">Tableau de bord</h1>
        <p className="mt-3 text-sm text-muted">
          Connexion réussie. Cette page servira de point d’entrée pour les modules métier au prochain
          sprint.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Entreprise</p>
          <p className="mt-2 text-base font-medium text-text">
            {companyAccess?.companyName ?? "Entreprise non configuree"}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Utilisateur connecté</p>
          <p className="mt-2 text-base font-medium text-text">{user.email}</p>
        </div>

        <div className="mt-6">
          <DashboardSignOutButton />
        </div>
      </section>
    </main>
  );
}
