/**
 * Company service layer.
 * This module encapsulates tenant bootstrap and membership lookups.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_MESSAGES } from "@/constants/auth";
import type {
  BootstrapCompanyRequest,
  CompanyAccess,
  CompanyInvitation,
  CompanyInvitationResult,
  CompanyMember,
  CompanyResult,
  CreateCompanyInvitationRequest,
  InvitationContext,
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

export async function listCurrentCompanyMembers(
  supabase: SupabaseClient,
  options: {
    companyId: string;
    currentUserId: string;
    currentUserEmail: string | null;
    currentUserRole: CompanyAccess["role"];
  },
): Promise<CompanyMember[]> {
  const { data, error } = await supabase.rpc("list_company_members_for_current_user");

  if (!error && Array.isArray(data) && data.length > 0) {
    return data.map((item) => ({
      userId: String(item.user_id),
      email: String(item.email ?? ""),
      role: item.role as CompanyMember["role"],
      status: item.status as CompanyMember["status"],
      createdAt: String(item.created_at),
    }));
  }

  // Fallback path: if RPC is missing/failing, read company_members directly so the current user is still visible.
  const { data: fallbackRows, error: fallbackError } = await supabase
    .from("company_members")
    .select("user_id, role, status, created_at")
    .eq("company_id", options.companyId)
    .order("created_at", { ascending: true });

  if (!fallbackError && Array.isArray(fallbackRows) && fallbackRows.length > 0) {
    return fallbackRows.map((row) => ({
      userId: String(row.user_id),
      email:
        String(row.user_id) === options.currentUserId
          ? (options.currentUserEmail ?? "")
          : "email_non_disponible",
      role: row.role as CompanyMember["role"],
      status: row.status as CompanyMember["status"],
      createdAt: String(row.created_at),
    }));
  }

  return [
    {
      userId: options.currentUserId,
      email: options.currentUserEmail ?? "",
      role: options.currentUserRole,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function listCurrentCompanyPendingInvitations(
  supabase: SupabaseClient,
): Promise<CompanyInvitation[]> {
  const { data, error } = await supabase
    .from("company_invitations")
    .select("id, company_id, invited_email, proposed_role, status, token, expires_at, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item) => ({
    id: String(item.id),
    companyId: String(item.company_id),
    invitedEmail: String(item.invited_email),
    proposedRole: item.proposed_role as CompanyInvitation["proposedRole"],
    status: item.status as CompanyInvitation["status"],
    token: String(item.token),
    expiresAt: String(item.expires_at),
    createdAt: String(item.created_at),
  }));
}

export async function createCompanyInvitation(
  supabase: SupabaseClient,
  request: CreateCompanyInvitationRequest,
): Promise<CompanyInvitationResult> {
  try {
    const normalizedEmail = request.invitedEmail.trim().toLowerCase();

    const { data, error } = await supabase
      .from("company_invitations")
      .insert({
        company_id: request.companyId,
        invited_email: normalizedEmail,
        proposed_role: request.proposedRole,
      })
      .select("token")
      .single();

    if (error || !data?.token) {
      return {
        success: false,
        error: AUTH_MESSAGES.INVITE_CREATE_FAILED,
        invitationLink: null,
      };
    }

    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const invitationLink = `${origin}/invite/${data.token}`;

    return {
      success: true,
      error: null,
      invitationLink,
    };
  } catch {
    return {
      success: false,
      error: AUTH_MESSAGES.INVITE_CREATE_FAILED,
      invitationLink: null,
    };
  }
}

export async function getInvitationContextByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<InvitationContext | null> {
  const { data, error } = await supabase.rpc("get_invitation_context", {
    p_token: token,
  });

  const row = Array.isArray(data) ? data[0] : data;

  if (error || !row) {
    return null;
  }

  return {
    companyName: String(row.company_name ?? ""),
    invitedEmail: String(row.invited_email ?? ""),
    proposedRole: row.proposed_role as InvitationContext["proposedRole"],
    status: row.status as InvitationContext["status"],
    expiresAt: String(row.expires_at ?? ""),
    isValid: Boolean(row.is_valid),
  };
}
