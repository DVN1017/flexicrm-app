import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { createPipeline } from "@/services/dossier.service";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access || access.role === "member") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = (await request.json()) as { name?: unknown; description?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Pipeline name is required" }, { status: 400 });

  try {
    const pipeline = await createPipeline(supabase, {
      companyId: access.companyId,
      name,
      description: typeof body.description === "string" ? body.description : undefined,
    });
    return NextResponse.json({ pipeline }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create pipeline" }, { status: 400 });
  }
}
