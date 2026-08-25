/**
 * Company and tenant membership contracts.
 * These types centralize data used by company onboarding and tenant access control.
 */

export type CompanyStatus = "active" | "suspended";
export type CompanyRole = "owner" | "admin" | "member";
export type InvitationStatus = "pending" | "accepted" | "expired";

export interface SignUpCompanyOwnerRequest {
  email: string;
  password: string;
}

export interface BootstrapCompanyRequest {
  companyName: string;
}

export interface CompanyAccess {
  companyId: string;
  companyName: string;
  role: CompanyRole;
}

export interface CompanyResult {
  success: boolean;
  error: string | null;
}

export interface CompanyMember {
  userId: string;
  email: string;
  role: CompanyRole;
  status: "active" | "disabled";
  createdAt: string;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  invitedEmail: string;
  proposedRole: Exclude<CompanyRole, "owner">;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateCompanyInvitationRequest {
  companyId: string;
  invitedEmail: string;
  proposedRole: Exclude<CompanyRole, "owner">;
}

export interface CompanyInvitationResult extends CompanyResult {
  invitationLink: string | null;
}

export interface InvitationContext {
  companyName: string;
  invitedEmail: string;
  proposedRole: Exclude<CompanyRole, "owner">;
  status: InvitationStatus;
  expiresAt: string;
  isValid: boolean;
}
