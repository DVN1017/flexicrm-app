import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { createPipelineStage } from "@/services/dossier.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ pipelineId: string }> }) {
  const { pipelineId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access || access.role === "member") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = (await request.json()) as { name?: unknown; position?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const position = typeof body.position === "number" && Number.isInteger(body.position) && body.position >= 0 ? body.position : null;
  if (!name || position === null) return NextResponse.json({ error: "Stage name and position are required" }, { status: 400 });

  try {
    const stage = await createPipelineStage(supabase, { companyId: access.companyId, pipelineId, name, position });
    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create stage" }, { status: 400 });
  }
}
