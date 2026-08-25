import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { IncomingWhatsAppTextMessage } from "@/types/conversations";
import { createInboundTextMessage } from "@/services/message.service";
import { findOrCreateClient } from "@/services/client.service";
import { findOrCreateConversation } from "@/services/conversation.service";

interface WhatsAppAccountSecret {
  id: string;
  company_id: string;
  phone_number_id: string;
  access_token: string;
}

function getWhatsAppApiVersion() {
  return process.env.WHATSAPP_API_VERSION ?? "v23.0";
}

export async function getWhatsAppAccountByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppAccountSecret | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("whatsapp_accounts")
    .select("id, company_id, phone_number_id, access_token")
    .eq("phone_number_id", phoneNumberId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as WhatsAppAccountSecret | null;
}

export async function processIncomingWhatsAppText(input: IncomingWhatsAppTextMessage) {
  const account = await getWhatsAppAccountByPhoneNumberId(input.phoneNumberId);
  if (!account) throw new Error("WHATSAPP_ACCOUNT_NOT_FOUND");

  const admin = createAdminSupabaseClient();
  const client = await findOrCreateClient(admin, account.company_id, input.from, input.profileName);
  const conversation = await findOrCreateConversation(admin, account.company_id, client.id, account.id);

  const { data: existing } = await admin
    .from("messages")
    .select("id")
    .eq("company_id", account.company_id)
    .eq("external_message_id", input.externalMessageId)
    .maybeSingle();

  if (existing) return { account, client, conversation, duplicate: true };

  const message = await createInboundTextMessage(admin, {
    companyId: account.company_id,
    conversationId: conversation.id,
    body: input.text,
    externalMessageId: input.externalMessageId,
    rawPayload: input.rawPayload,
  });

  await admin.from("conversations").update({ last_message_at: message.created_at }).eq("id", conversation.id).eq("company_id", account.company_id);
  return { account, client, conversation, message, duplicate: false };
}

export async function sendWhatsAppTextMessage(input: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}) {
  const response = await fetch(`https://graph.facebook.com/${getWhatsAppApiVersion()}/${input.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: { body: input.text, preview_url: false },
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`WHATSAPP_API_ERROR:${response.status}:${JSON.stringify(payload)}`);
  }
  return payload;
}
