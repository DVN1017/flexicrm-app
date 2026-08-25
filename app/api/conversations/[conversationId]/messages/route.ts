import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { createOutboundTextMessage } from "@/services/message.service";
import { sendWhatsAppTextMessage } from "@/services/whatsapp.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  const body = (await request.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Message text is required" }, { status: 400 });

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, client_id, whatsapp_account_id, clients(phone), whatsapp_accounts(phone_number_id)")
    .eq("company_id", access.companyId)
    .eq("id", conversationId)
    .single();
  if (conversationError || !conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const admin = createAdminSupabaseClient();
  const { data: account, error: accountError } = await admin
    .from("whatsapp_accounts")
    .select("id, company_id, phone_number_id, access_token")
    .eq("id", conversation.whatsapp_account_id)
    .eq("company_id", access.companyId)
    .eq("status", "active")
    .single();
  if (accountError || !account) return NextResponse.json({ error: "WhatsApp account is not configured" }, { status: 409 });

  const clientRelation = conversation.clients as { phone?: string } | { phone?: string }[] | null;
  const clientPhone = Array.isArray(clientRelation) ? clientRelation[0]?.phone : clientRelation?.phone;
  if (!clientPhone) return NextResponse.json({ error: "Client phone is missing" }, { status: 409 });

  try {
    const result = await sendWhatsAppTextMessage({ phoneNumberId: account.phone_number_id, accessToken: account.access_token, to: clientPhone, text });
    const messages = Array.isArray(result.messages) ? result.messages : [];
    const externalMessageId = typeof (messages[0] as Record<string, unknown> | undefined)?.id === "string" ? String((messages[0] as Record<string, unknown>).id) : undefined;
    const message = await createOutboundTextMessage(supabase, { companyId: access.companyId, conversationId, userId: user.id, body: text, externalMessageId, status: "sent" });
    await supabase.from("conversations").update({ last_message_at: message.created_at }).eq("id", conversationId).eq("company_id", access.companyId);
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "WhatsApp send failed" }, { status: 502 });
  }
}
