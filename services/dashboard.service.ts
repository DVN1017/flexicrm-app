import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardStats {
  newClients: number;
  activeConversations: number;
  openDossiers: number;
  closedDossiers: number;
}

export async function getDashboardStats(supabase: SupabaseClient, companyId: string): Promise<DashboardStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [newClients, activeConversations, openDossiers, closedDossiers] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("created_at", since),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["open", "pending"]),
    supabase.from("dossiers").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["open", "pending"]),
    supabase.from("dossiers").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["completed", "cancelled"]),
  ]);

  const errors = [newClients, activeConversations, openDossiers, closedDossiers].filter((result) => result.error);
  if (errors.length > 0) throw new Error(errors[0].error?.message ?? "Unable to load dashboard statistics");

  return {
    newClients: newClients.count ?? 0,
    activeConversations: activeConversations.count ?? 0,
    openDossiers: openDossiers.count ?? 0,
    closedDossiers: closedDossiers.count ?? 0,
  };
}
