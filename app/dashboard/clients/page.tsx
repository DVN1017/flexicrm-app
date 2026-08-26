import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { listClients } from "@/services/client.service";

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  const clients = await listClients(supabase, access.companyId);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href={AUTH_ROUTES.DASHBOARD} className="text-sm text-primary hover:underline">← Tableau de bord</Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Clients</h1>
            <p className="mt-1 text-sm text-muted">Retrouvez les clients créés depuis vos échanges WhatsApp.</p>
          </div>
          <div className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">{clients.length} client(s)</div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          {clients.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold">Aucun client</h2>
              <p className="mt-2 text-sm text-muted">Un client apparaîtra automatiquement à la réception de son premier message WhatsApp.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="block p-5 transition hover:bg-background">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      <p className="mt-1 text-sm text-muted">{client.phone}</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p>{client.email ?? "Email non renseigné"}</p>
                      <p className="mt-1">Créé le {new Date(client.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
