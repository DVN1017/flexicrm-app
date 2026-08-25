import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, MessageStatus } from "@/types/conversations";

const messageSelect = "id, company_id, conversation_id, sender_type, sender_user_id, direction, message_type, body, external_message_id, status, raw_payload, created_at";

export async function listMessages(supabase: SupabaseClient, companyId: string, conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(messageSelect)
    .eq("company_id", companyId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function createInboundTextMessage(
  supabase: SupabaseClient,
  input: { companyId: string; conversationId: string; body: string; externalMessageId?: string; rawPayload?: Record<string, unknown> },
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ company_id: input.companyId, conversation_id: input.conversationId, sender_type: "client", direction: "inbound", message_type: "text", body: input.body, external_message_id: input.externalMessageId ?? null, status: "received", raw_payload: input.rawPayload ?? null })
    .select(messageSelect)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create inbound message");
  return data as Message;
}

export async function createOutboundTextMessage(
  supabase: SupabaseClient,
  input: { companyId: string; conversationId: string; userId: string; body: string; externalMessageId?: string; status?: MessageStatus },
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ company_id: input.companyId, conversation_id: input.conversationId, sender_type: "employee", sender_user_id: input.userId, direction: "outbound", message_type: "text", body: input.body, external_message_id: input.externalMessageId ?? null, status: input.status ?? "queued" })
    .select(messageSelect)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create outbound message");
  return data as Message;
}

export async function updateMessageStatus(
  supabase: SupabaseClient,
  companyId: string,
  externalMessageId: string,
  status: MessageStatus,
) {
  const { data, error } = await supabase
    .from("messages")
    .update({ status })
    .eq("company_id", companyId)
    .eq("external_message_id", externalMessageId)
    .select(messageSelect)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Message | null;
}
