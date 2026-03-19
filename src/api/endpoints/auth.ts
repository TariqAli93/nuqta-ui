/**
 * Auth API endpoints.
 *
 * Replaces: ipc/authClient.ts
 */
import type { ApiResult } from '../contracts';
import type { UserPublic, FirstUserInput, CompanySettings } from '../../types/domain';
import { apiGet, apiPost } from '../http';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface AuthLoginRequest {
  username: string;
  password: string;
  [key: string]: any;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserPublic;
  permissions: string[];
}

export interface AuthSetupStatus {
  isInitialized: boolean;
  hasUsers: boolean;
  hasCompanyInfo: boolean;
  wizardCompleted: boolean;
}

export interface InitializeAppRequest {
  admin: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
  };
  companySettings: CompanySettings;
}

interface AuthVerifyCredentialsRequest {
  username: string;
  password: string;
  [key: string]: any;
}

interface AuthVerifyCredentialsResponse {
  user: UserPublic;
  permissions?: string[];
}

interface AuthChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
  [key: string]: any;
}

interface AuthChangePasswordResponse {
  success: true;
}

interface AuthValidateTokenResponse {
  valid: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const authClient = {
  login: (credentials: AuthLoginRequest): Promise<ApiResult<AuthLoginResponse>> =>
    apiPost<AuthLoginResponse>('/auth/login', credentials),

  checkInitialSetup: (): Promise<ApiResult<AuthSetupStatus>> =>
    apiGet<AuthSetupStatus>('/auth/setup-status'),

  createFirstUser: (userData: FirstUserInput): Promise<ApiResult<AuthLoginResponse>> =>
    apiPost<AuthLoginResponse>('/auth/register', userData),

  initializeApp: (
    data: InitializeAppRequest
  ): Promise<ApiResult<{ success: boolean; admin: UserPublic }>> =>
    apiPost<{ success: boolean; admin: UserPublic }>('/auth/register', data),

  /** Token refresh — TODO: Add backend endpoint if needed */
  refresh: (): Promise<ApiResult<{ accessToken: string }>> =>
    apiPost<{ accessToken: string }>('/auth/refresh'),

  /** Logout — client-side token clear, optionally call backend */
  logout: (): Promise<ApiResult<{ ok: true }>> => apiPost<{ ok: true }>('/auth/logout'),

  getCurrentUser: (): Promise<ApiResult<{ user: UserPublic; permissions: string[] }>> =>
    apiGet<{ user: UserPublic; permissions: string[] }>('/auth/me'),

  verifyCredentials: (
    credentials: AuthVerifyCredentialsRequest
  ): Promise<ApiResult<AuthVerifyCredentialsResponse>> =>
    apiPost<AuthVerifyCredentialsResponse>('/auth/login', credentials),

  changePassword: (
    payload: AuthChangePasswordRequest
  ): Promise<ApiResult<AuthChangePasswordResponse>> =>
    apiPost<AuthChangePasswordResponse>('/auth/change-password', payload),

  validateToken: (payload: { token: string }): Promise<ApiResult<AuthValidateTokenResponse>> =>
    apiGet<AuthValidateTokenResponse>('/auth/me'),
};
