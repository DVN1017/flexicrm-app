/**
 * Company service layer.
 * This module encapsulates tenant bootstrap and membership lookups.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_MESSAGES } from "@/constants/auth";
import type {
  BootstrapCompanyRequest,
  CompanyAccess,
  CompanyResult,
  SignUpCompanyOwnerRequest,
} from "@/types/company";

function mapSignUpErrorToMessage(rawMessage: string | undefined): string {
  const normalized = (rawMessage ?? "").toLowerCase();

  if (
    normalized.includes("already") ||
    normalized.includes("exists") ||
    normalized.includes("registered") ||
    normalized.includes("unique")
  ) {
    return AUTH_MESSAGES.CREATE_COMPANY_EMAIL_ALREADY_USED;
  }

  return AUTH_MESSAGES.CREATE_COMPANY_FAILED;
}

export async function signUpCompanyOwnerAccount(
  supabase: SupabaseClient,
  request: SignUpCompanyOwnerRequest,
): Promise<CompanyResult> {
  try {
    const { error: signUpError } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
    });

    if (signUpError) {
      return {
        success: false,
        error: mapSignUpErrorToMessage(signUpError.message),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.CREATE_COMPANY_FAILED,
    };
  }
}

export async function bootstrapCompanyForCurrentUser(
  supabase: SupabaseClient,
  request: BootstrapCompanyRequest,
): Promise<CompanyResult> {
  try {
    const { error } = await supabase.rpc("bootstrap_company", {
      p_company_name: request.companyName,
    });

    if (error) {
      return {
        success: false,
        error: AUTH_MESSAGES.CREATE_COMPANY_FAILED,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.CREATE_COMPANY_FAILED,
    };
  }
}

export async function getCurrentUserCompanyAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<CompanyAccess | null> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, role, companies(name)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const companyRelation = data.companies as { name?: string } | { name?: string }[] | null;
  const companyName = Array.isArray(companyRelation)
    ? (companyRelation[0]?.name ?? "")
    : (companyRelation?.name ?? "");

  if (!companyName) {
    return null;
  }

  return {
    companyId: data.company_id as string,
    companyName,
    role: data.role as CompanyAccess["role"],
  };
}
