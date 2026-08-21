/**
 * Authentication service layer.
 * This module encapsulates Supabase auth calls so presentation components never call Supabase directly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_MESSAGES } from "@/constants/auth";
import type { AuthResult, LoginCredentials } from "@/types/auth";

export async function signInWithPassword(
  supabase: SupabaseClient,
  credentials: LoginCredentials,
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: AUTH_MESSAGES.INVALID_CREDENTIALS,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.INVALID_CREDENTIALS,
    };
  }
}
