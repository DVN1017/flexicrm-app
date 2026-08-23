/**
 * Company and tenant membership contracts.
 * These types centralize data used by company onboarding and tenant access control.
 */

export type CompanyStatus = "active" | "suspended";
export type CompanyRole = "owner" | "admin" | "member";

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
