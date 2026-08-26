import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { processIncomingWhatsAppText } from "@/services/whatsapp.service";

/** Development/manual simulator. It requires an authenticated FlexiCRM session and an explicit env flag. */
export async function POST(request: NextRequest) {
  if (process.env.ALLOW_WHATSAPP_TEST_ROUTE !== "true") {
    return NextResponse.json({ error: "Test route disabled" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  let body: {
    phoneNumberId?: string;
    from?: string;
    profileName?: string;
    text?: string;
  } = {};

  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  let phoneNumberId = body.phoneNumberId?.trim();

  if (!phoneNumberId) {
    const admin = createAdminSupabaseClient();
    const { data: account, error } = await admin
      .from("whatsapp_accounts")
      .select("phone_number_id")
      .eq("company_id", access.companyId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Unable to find a test WhatsApp account" }, { status: 500 });
    }

    phoneNumberId = account?.phone_number_id;
  }

  if (!phoneNumberId) {
    return NextResponse.json({ error: "No active WhatsApp account configured for this company" }, { status: 400 });
  }

  const from = body.from?.trim() || "22670000000";
  const profileName = body.profileName?.trim() || "Client Test";
  const text = body.text?.trim() || "Bonjour, ceci est un message entrant de test WhatsApp.";

  try {
    const result = await processIncomingWhatsAppText({
      externalMessageId: `test-${crypto.randomUUID()}`,
      phoneNumberId,
      from,
      profileName,
      text,
      rawPayload: {
        test: true,
        companyId: access.companyId,
        phoneNumberId,
        from,
        profileName,
        text,
      },
    });

    return NextResponse.json({
      ok: true,
      conversationId: result.conversation.id,
      messageId: result.message?.id ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Simulation failed" }, { status: 500 });
  }
}
