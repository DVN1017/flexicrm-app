import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "@/types/conversations";

export async function findOrCreateClient(
  supabase: SupabaseClient,
  companyId: string,
  phone: string,
  name?: string,
): Promise<Client> {
  const normalizedPhone = phone.trim();
  const { data: existing, error: findError } = await supabase
    .from("clients")
    .select("id, company_id, name, phone, email, address, notes, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) return existing as Client;

  const { data, error } = await supabase
    .from("clients")
    .insert({ company_id: companyId, phone: normalizedPhone, name: name?.trim() || "WhatsApp contact" })
    .select("id, company_id, name, phone, email, address, notes, created_at, updated_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to create client");
  return data as Client;
}

export async function getClientById(supabase: SupabaseClient, companyId: string, clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_id, name, phone, email, address, notes, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("id", clientId)
    .single();
  if (error) throw new Error(error.message);
  return data as Client;
}
