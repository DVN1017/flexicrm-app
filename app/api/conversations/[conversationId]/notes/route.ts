import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { createConversationNote } from "@/services/conversation.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  const body = (await request.json()) as { body?: unknown };
  const noteBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!noteBody) return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  if (noteBody.length > 5000) return NextResponse.json({ error: "Note is too long" }, { status: 400 });

  try {
    const note = await createConversationNote(supabase, {
      companyId: access.companyId,
      conversationId,
      authorUserId: user.id,
      body: noteBody,
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create note" },
      { status: 400 },
    );
  }
}
