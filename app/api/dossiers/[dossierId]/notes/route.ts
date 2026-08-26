import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { createDossierNote } from "@/services/dossier.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const { dossierId } = await params;
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
    const note = await createDossierNote(supabase, { companyId: access.companyId, dossierId, authorUserId: user.id, body: noteBody });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create dossier note" }, { status: 400 });
  }
}
