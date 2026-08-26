import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { WhatsAppTestSimulatorButton } from "@/components/conversations/WhatsAppTestSimulatorButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { listConversations } from "@/services/conversation.service";

export default async function ConversationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  const conversations = await listConversations(supabase, access.companyId);
  const showWhatsAppTestSimulator = process.env.ALLOW_WHATSAPP_TEST_ROUTE === "true";

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href={AUTH_ROUTES.DASHBOARD} className="text-sm text-primary hover:underline">← Tableau de bord</Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Conversations</h1>
            <p className="mt-1 text-sm text-muted">Centralisez les échanges WhatsApp de votre entreprise.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted">{conversations.length} conversation(s)</div>
            {showWhatsAppTestSimulator ? <WhatsAppTestSimulatorButton /> : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          {conversations.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold">Aucune conversation</h2>
              <p className="mt-2 text-sm text-muted">Les nouveaux messages WhatsApp apparaîtront ici.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <Link key={conversation.id} href={`/dashboard/conversations/${conversation.id}`} className="block p-5 transition hover:bg-background">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{conversation.client?.name ?? "Client"}</p>
                      <p className="mt-1 text-sm text-muted">{conversation.client?.phone ?? ""}</p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p>{conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString("fr-FR") : "Nouvelle conversation"}</p>
                      <p className="mt-2 inline-block rounded-full border border-border px-2 py-1">{conversation.status}</p>
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
