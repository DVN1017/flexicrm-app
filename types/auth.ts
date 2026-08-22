/**
 * Shared authentication data contracts.
 * This file centralizes auth-related TypeScript interfaces so contract changes are caught at compile time.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
  redirectTo: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface AuthResult {
  success: boolean;
  error: string | null;
}
