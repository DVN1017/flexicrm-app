import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { getClientById, listClientConversations } from "@/services/client.service";

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  let client;
  try {
    client = await getClientById(supabase, access.companyId, clientId);
  } catch {
    notFound();
  }

  const conversations = await listClientConversations(supabase, access.companyId, clientId);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <Link href="/dashboard/clients" className="text-sm text-primary hover:underline">← Clients</Link>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <p className="mt-1 text-sm text-muted">{client.phone}</p>
            </div>
            <Link href={`/dashboard/conversations?client=${client.id}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-background">
              Voir les conversations
            </Link>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted">Email</dt>
              <dd className="mt-1 text-sm">{client.email ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Adresse</dt>
              <dd className="mt-1 text-sm">{client.address ?? "Non renseignée"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted">Notes client</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm">{client.notes ?? "Aucune note"}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface shadow-soft">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Historique des conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-muted">Aucune conversation enregistrée.</p>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <Link key={conversation.id} href={`/dashboard/conversations/${conversation.id}`} className="block p-5 hover:bg-background">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{conversation.subject ?? "Conversation WhatsApp"}</p>
                      <p className="mt-1 text-xs text-muted">{conversation.status}</p>
                    </div>
                    <p className="text-xs text-muted">
                      {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString("fr-FR") : "Aucun message"}
                    </p>
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
