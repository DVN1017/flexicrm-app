/**
 * Company creation route.
 * This page provides the initial bootstrap flow for a new company owner account.
 */
import { CreateCompanyForm } from "@/components/auth/CreateCompanyForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CreateCompanyPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <CreateCompanyForm isAuthenticated={Boolean(user)} />;
}
