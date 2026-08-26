export type DossierPriority = "low" | "normal" | "high" | "urgent";
export type DossierStatus = "open" | "pending" | "completed" | "cancelled";

export interface Pipeline {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  company_id: string;
  pipeline_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Dossier {
  id: string;
  company_id: string;
  client_id: string;
  pipeline_id: string;
  stage_id: string;
  assigned_user_id: string | null;
  source_conversation_id: string | null;
  title: string;
  priority: DossierPriority;
  status: DossierStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  client?: { id: string; name: string; phone: string } | null;
  stage?: PipelineStage | null;
}

export interface DossierNote {
  id: string;
  company_id: string;
  dossier_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}
