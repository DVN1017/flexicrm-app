/**
 * Server-side Supabase client helpers.
 * This module centralizes secure server-side configuration using the SSR client pattern.
 * It follows the project requirement to use cookie-based auth flows on the server for sensitive operations.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie);
          }
        },
      },
    },
  );
}
