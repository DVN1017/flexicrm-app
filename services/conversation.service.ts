import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation } from "@/types/conversations";

const conversationSelect = `id, company_id, client_id, whatsapp_account_id, assigned_user_id, status, subject, last_message_at, created_at, updated_at, clients(id, company_id, name, phone, email, address, notes, created_at, updated_at)`;

export async function listConversations(supabase: SupabaseClient, companyId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .eq("company_id", companyId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    client: row.clients,
  })) as unknown as Conversation[];
}

export async function getConversation(supabase: SupabaseClient, companyId: string, conversationId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .eq("company_id", companyId)
    .eq("id", conversationId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Conversation not found");
  return { ...data, client: data.clients } as unknown as Conversation;
}

export async function findOrCreateConversation(
  supabase: SupabaseClient,
  companyId: string,
  clientId: string,
  whatsappAccountId: string,
): Promise<Conversation> {
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .eq("company_id", companyId)
    .eq("client_id", clientId)
    .eq("whatsapp_account_id", whatsappAccountId)
    .in("status", ["open", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return { ...existing, client: existing.clients } as unknown as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ company_id: companyId, client_id: clientId, whatsapp_account_id: whatsappAccountId, status: "open" })
    .select(conversationSelect)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create conversation");
  return { ...data, client: data.clients } as unknown as Conversation;
}

export async function assignConversation(
  supabase: SupabaseClient,
  companyId: string,
  conversationId: string,
  assignedUserId: string | null,
) {
  const { data, error } = await supabase
    .from("conversations")
    .update({ assigned_user_id: assignedUserId })
    .eq("company_id", companyId)
    .eq("id", conversationId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to assign conversation");
  return data as Conversation;
}
