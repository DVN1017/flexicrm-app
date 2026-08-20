/**
 * Browser-side Supabase client factory.
 * This file exists to centralize the public client configuration used by browser components.
 * For Sprint 1, it is prepared for later auth usage without adding any active business logic.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
