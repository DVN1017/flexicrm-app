import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { createDossier } from "@/services/dossier.service";
import type { DossierPriority } from "@/types/dossiers";

const PRIORITIES: DossierPriority[] = ["low", "normal", "high", "urgent"];

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  const pipelineId = typeof body.pipelineId === "string" ? body.pipelineId : "";
  const stageId = typeof body.stageId === "string" ? body.stageId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const priority = typeof body.priority === "string" && PRIORITIES.includes(body.priority as DossierPriority) ? body.priority as DossierPriority : "normal";
  if (!clientId || !pipelineId || !stageId || !title) return NextResponse.json({ error: "Client, pipeline, stage and title are required" }, { status: 400 });

  try {
    const dossier = await createDossier(supabase, {
      companyId: access.companyId,
      clientId,
      pipelineId,
      stageId,
      assignedUserId: access.role === "member" ? user.id : null,
      title,
      priority,
    });
    return NextResponse.json({ dossier }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create dossier" }, { status: 400 });
  }
}
