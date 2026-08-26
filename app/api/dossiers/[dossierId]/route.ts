import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { updateDossier } from "@/services/dossier.service";
import type { DossierPriority, DossierStatus } from "@/types/dossiers";

const PRIORITIES: DossierPriority[] = ["low", "normal", "high", "urgent"];
const STATUSES: DossierStatus[] = ["open", "pending", "completed", "cancelled"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const { dossierId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) return NextResponse.json({ error: "Company not found" }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const stageId = typeof body.stageId === "string" ? body.stageId : undefined;
  const assignedUserId = body.assignedUserId === null || typeof body.assignedUserId === "string" ? body.assignedUserId : undefined;
  const priority = typeof body.priority === "string" && PRIORITIES.includes(body.priority as DossierPriority) ? body.priority as DossierPriority : undefined;
  const status = typeof body.status === "string" && STATUSES.includes(body.status as DossierStatus) ? body.status as DossierStatus : undefined;
  const title = typeof body.title === "string" ? body.title : undefined;
  const notes = typeof body.notes === "string" || body.notes === null ? body.notes as string | null : undefined;

  if (!stageId && assignedUserId === undefined && !priority && !status && title === undefined && notes === undefined) {
    return NextResponse.json({ error: "No supported update provided" }, { status: 400 });
  }

  try {
    const dossier = await updateDossier(supabase, { companyId: access.companyId, dossierId, stageId, assignedUserId, priority, status, title, notes });
    return NextResponse.json({ dossier });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dossier update failed" }, { status: 400 });
  }
}
