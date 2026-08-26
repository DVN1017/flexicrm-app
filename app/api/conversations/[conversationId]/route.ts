import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { assignConversation, updateConversationStatus } from "@/services/conversation.service";
import type { ConversationStatus } from "@/types/conversations";

const STATUSES: ConversationStatus[] = ["open", "pending", "closed"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  const body = (await request.json()) as { assignedUserId?: unknown; status?: unknown };

  try {
    if (typeof body.status === "string") {
      if (!STATUSES.includes(body.status as ConversationStatus)) {
        return NextResponse.json({ error: "Invalid conversation status" }, { status: 400 });
      }
      const conversation = await updateConversationStatus(
        supabase,
        access.companyId,
        conversationId,
        body.status as ConversationStatus,
      );
      return NextResponse.json({ conversation });
    }

    if (body.assignedUserId === null || typeof body.assignedUserId === "string") {
      const conversation = await assignConversation(
        supabase,
        access.companyId,
        conversationId,
        body.assignedUserId === null ? null : body.assignedUserId,
      );
      return NextResponse.json({ conversation });
    }

    return NextResponse.json({ error: "No supported update provided" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation update failed" },
      { status: 400 },
    );
  }
}
