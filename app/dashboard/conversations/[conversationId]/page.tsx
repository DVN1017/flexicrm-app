import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess, listCurrentCompanyMembers } from "@/services/company.service";
import { getConversation, listConversationNotes } from "@/services/conversation.service";
import { listMessages } from "@/services/message.service";
import { ConversationControls } from "@/components/conversations/ConversationControls";
import { MessageComposer } from "@/components/conversations/MessageComposer";
import { PrivateNotes } from "@/components/conversations/PrivateNotes";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  let conversation;
  try {
    conversation = await getConversation(supabase, access.companyId, conversationId);
  } catch {
    notFound();
  }

  const [messages, notes, members] = await Promise.all([
    listMessages(supabase, access.companyId, conversationId),
    listConversationNotes(supabase, access.companyId, conversationId),
    listCurrentCompanyMembers(supabase, {
      companyId: access.companyId,
      currentUserId: user.id,
      currentUserEmail: user.email ?? null,
      currentUserRole: access.role,
    }),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <header className="flex items-center gap-4 border-b border-border px-5 py-4">
          <Link href="/dashboard/conversations" className="text-sm text-primary hover:underline">← Conversations</Link>
          <div className="border-l border-border pl-4">
            <h1 className="font-semibold">{conversation.client?.name ?? "Client"}</h1>
            <p className="text-xs text-muted">{conversation.client?.phone ?? ""}</p>
          </div>
        </header>

        <ConversationControls
          conversationId={conversationId}
          assignedUserId={conversation.assigned_user_id}
          status={conversation.status}
          members={members.map((member) => ({ userId: member.userId, email: member.email, role: member.role }))}
        />

        <div className="flex-1 space-y-3 overflow-y-auto bg-background p-5">
          {messages.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-muted">Aucun message dans cette conversation.</div>
          ) : messages.map((message) => {
            const outgoing = message.direction === "outbound";
            return (
              <div key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${outgoing ? "rounded-br-md bg-primary text-white" : "rounded-bl-md border border-border bg-surface text-text"}`}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className={`mt-1 text-[11px] ${outgoing ? "text-white/70" : "text-muted"}`}>{new Date(message.created_at).toLocaleString("fr-FR")}</p>
                </div>
              </div>
            );
          })}
        </div>

        <PrivateNotes conversationId={conversationId} initialNotes={notes} />
        <MessageComposer conversationId={conversationId} />
      </section>
    </main>
  );
}
