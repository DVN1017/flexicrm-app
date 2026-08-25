import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { processIncomingWhatsAppText } from "@/services/whatsapp.service";

/** Development/manual simulator. It requires an authenticated FlexiCRM session. */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_WHATSAPP_TEST_ROUTE !== "true") {
    return NextResponse.json({ error: "Test route disabled in production" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  const body = (await request.json()) as {
    phoneNumberId?: string;
    from?: string;
    profileName?: string;
    text?: string;
  };

  if (!body.phoneNumberId || !body.from || !body.text?.trim()) {
    return NextResponse.json({ error: "phoneNumberId, from and text are required" }, { status: 400 });
  }

  try {
    const result = await processIncomingWhatsAppText({
      externalMessageId: `test-${crypto.randomUUID()}`,
      phoneNumberId: body.phoneNumberId,
      from: body.from,
      profileName: body.profileName,
      text: body.text.trim(),
      rawPayload: { test: true, companyId: access.companyId },
    });
    return NextResponse.json({ ok: true, conversationId: result.conversation.id, messageId: result.message?.id ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Simulation failed" }, { status: 500 });
  }
}
