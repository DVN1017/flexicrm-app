import type { SupabaseClient } from "@supabase/supabase-js";

import type { Dossier, DossierNote, DossierPriority, DossierStatus, Pipeline, PipelineStage } from "@/types/dossiers";

export async function listPipelines(supabase: SupabaseClient, companyId: string): Promise<Pipeline[]> {
  const { data, error } = await supabase
    .from("pipelines")
    .select("id, company_id, name, description, is_active, created_at, updated_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Pipeline[];
}

export async function getPipelineStages(supabase: SupabaseClient, companyId: string, pipelineId: string): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id, company_id, pipeline_id, name, position, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("pipeline_id", pipelineId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PipelineStage[];
}

export async function createPipeline(supabase: SupabaseClient, input: { companyId: string; name: string; description?: string }): Promise<Pipeline> {
  const { data, error } = await supabase
    .from("pipelines")
    .insert({ company_id: input.companyId, name: input.name.trim(), description: input.description?.trim() || null })
    .select("id, company_id, name, description, is_active, created_at, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create pipeline");
  return data as Pipeline;
}

export async function createPipelineStage(supabase: SupabaseClient, input: { companyId: string; pipelineId: string; name: string; position: number }): Promise<PipelineStage> {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({ company_id: input.companyId, pipeline_id: input.pipelineId, name: input.name.trim(), position: input.position })
    .select("id, company_id, pipeline_id, name, position, created_at, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create pipeline stage");
  return data as PipelineStage;
}

const dossierSelect = `id, company_id, client_id, pipeline_id, stage_id, assigned_user_id, source_conversation_id, title, priority, status, notes, created_at, updated_at, closed_at, clients(id, name, phone), pipeline_stages(id, company_id, pipeline_id, name, position, created_at, updated_at)`;

export async function listDossiers(supabase: SupabaseClient, companyId: string): Promise<Dossier[]> {
  const { data, error } = await supabase
    .from("dossiers")
    .select(dossierSelect)
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, client: row.clients, stage: row.pipeline_stages })) as unknown as Dossier[];
}

export async function getDossier(supabase: SupabaseClient, companyId: string, dossierId: string): Promise<Dossier> {
  const { data, error } = await supabase
    .from("dossiers")
    .select(dossierSelect)
    .eq("company_id", companyId)
    .eq("id", dossierId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Dossier not found");
  return { ...data, client: data.clients, stage: data.pipeline_stages } as unknown as Dossier;
}

export async function createDossier(supabase: SupabaseClient, input: { companyId: string; clientId: string; pipelineId: string; stageId: string; assignedUserId?: string | null; sourceConversationId?: string | null; title: string; priority?: DossierPriority; notes?: string | null }): Promise<Dossier> {
  const { data, error } = await supabase
    .from("dossiers")
    .insert({
      company_id: input.companyId,
      client_id: input.clientId,
      pipeline_id: input.pipelineId,
      stage_id: input.stageId,
      assigned_user_id: input.assignedUserId ?? null,
      source_conversation_id: input.sourceConversationId ?? null,
      title: input.title.trim(),
      priority: input.priority ?? "normal",
      notes: input.notes?.trim() || null,
    })
    .select(dossierSelect)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create dossier");
  return { ...data, client: data.clients, stage: data.pipeline_stages } as unknown as Dossier;
}

export async function updateDossier(supabase: SupabaseClient, input: { companyId: string; dossierId: string; stageId?: string; assignedUserId?: string | null; priority?: DossierPriority; status?: DossierStatus; title?: string; notes?: string | null }): Promise<Dossier> {
  const patch: Record<string, unknown> = {};
  if (input.stageId !== undefined) patch.stage_id = input.stageId;
  if (input.assignedUserId !== undefined) patch.assigned_user_id = input.assignedUserId;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.status !== undefined) patch.status = input.status;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;

  const { data, error } = await supabase
    .from("dossiers")
    .update(patch)
    .eq("company_id", input.companyId)
    .eq("id", input.dossierId)
    .select(dossierSelect)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update dossier");
  return { ...data, client: data.clients, stage: data.pipeline_stages } as unknown as Dossier;
}

export async function listDossierNotes(supabase: SupabaseClient, companyId: string, dossierId: string): Promise<DossierNote[]> {
  const { data, error } = await supabase
    .from("dossier_notes")
    .select("id, company_id, dossier_id, author_user_id, body, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DossierNote[];
}

export async function createDossierNote(supabase: SupabaseClient, input: { companyId: string; dossierId: string; authorUserId: string; body: string }): Promise<DossierNote> {
  const { data, error } = await supabase
    .from("dossier_notes")
    .insert({ company_id: input.companyId, dossier_id: input.dossierId, author_user_id: input.authorUserId, body: input.body.trim() })
    .select("id, company_id, dossier_id, author_user_id, body, created_at, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create dossier note");
  return data as DossierNote;
}
