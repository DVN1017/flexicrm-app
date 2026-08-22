/**
 * Authentication service layer.
 * This module encapsulates Supabase auth calls so presentation components never call Supabase directly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_MESSAGES } from "@/constants/auth";
import type {
  AuthResult,
  ForgotPasswordRequest,
  LoginCredentials,
  ResetPasswordRequest,
} from "@/types/auth";

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

export async function requestPasswordReset(
  supabase: SupabaseClient,
  request: ForgotPasswordRequest,
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: request.redirectTo,
    });

    if (error) {
      return {
        success: false,
        error: AUTH_MESSAGES.PASSWORD_UPDATE_FAILED,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.PASSWORD_UPDATE_FAILED,
    };
  }
}

export async function updatePassword(
  supabase: SupabaseClient,
  request: ResetPasswordRequest,
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: request.password,
    });

    if (error) {
      return {
        success: false,
        error: AUTH_MESSAGES.PASSWORD_UPDATE_FAILED,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.PASSWORD_UPDATE_FAILED,
    };
  }
}

export async function signOut(supabase: SupabaseClient): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: AUTH_MESSAGES.SIGN_OUT_FAILED,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.SIGN_OUT_FAILED,
    };
  }
}
