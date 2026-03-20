/**
 * Auth API endpoints.
 *
 * Replaces: ipc/authClient.ts
 */
import type { ApiResult } from '../contracts';
import type { UserPublic, FirstUserInput } from '../../types/domain';
import { apiGet, apiPost } from '../http';
import { getAccessToken } from '../http';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface AuthLoginRequest {
  username: string;
  password: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  /** Legacy alias — same value as accessToken */
  token?: string;
  refreshToken: string;
  user: UserPublic;
  permissions: string[];
}

export interface AuthSetupStatus {
  isInitialized: boolean;
  hasUsers: boolean;
  hasCompanyInfo: boolean;
  wizardCompleted: boolean;
}

/** Backend returns full login response (with tokens) after register. */
export type RegisterResponse = AuthLoginResponse;

export interface InitializeAppRequest {
  admin: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
  };
  companySettings?: {
    name?: string;
    currency?: string;
    address?: string | null;
    phone?: string | null;
    phone2?: string | null;
    email?: string | null;
    taxId?: string | null;
    logo?: string | null;
  };
}

interface AuthChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface AuthChangePasswordResponse {
  success: true;
}

/**
 * GET /auth/me returns the currently authenticated user plus their permissions.
 */
export interface MeResponse extends UserPublic {
  permissions: string[];
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const authClient = {
  login: (credentials: AuthLoginRequest): Promise<ApiResult<AuthLoginResponse>> =>
    apiPost<AuthLoginResponse>('/auth/login', credentials),

  checkInitialSetup: (): Promise<ApiResult<AuthSetupStatus>> =>
    apiGet<AuthSetupStatus>('/auth/setup-status'),

  /**
   * Register the first admin user. Returns the created UserSafe (no token).
   * Callers must login separately to obtain a token.
   */
  createFirstUser: (userData: FirstUserInput): Promise<ApiResult<RegisterResponse>> =>
    apiPost<RegisterResponse>('/auth/register', userData),

  /**
   * Token refresh. Requires the stored refreshToken in the body.
   */
  refresh: (refreshToken: string): Promise<ApiResult<AuthLoginResponse>> =>
    apiPost<AuthLoginResponse>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string): Promise<ApiResult<null>> =>
    apiPost<null>('/auth/logout', refreshToken ? { refreshToken } : undefined),

  /**
   * Get the current authenticated user with their permissions.
   * Backend returns: { ...UserSafe, permissions: string[] }
   */
  getCurrentUser: (): Promise<ApiResult<MeResponse>> =>
    apiGet<MeResponse>('/auth/me'),

  changePassword: (
    payload: AuthChangePasswordRequest
  ): Promise<ApiResult<AuthChangePasswordResponse>> =>
    apiPost<AuthChangePasswordResponse>('/auth/change-password', payload),

  /**
   * Validate that the current access token is still valid by calling /auth/me.
   */
  validateToken: (): Promise<ApiResult<MeResponse>> =>
    apiGet<MeResponse>('/auth/me'),

  /**
   * Initialize the application with admin user and company settings.
   * Calls POST /settings/setup-wizard.
   */
  initializeApp: (payload: InitializeAppRequest): Promise<ApiResult<{ success: boolean }>> =>
    apiPost<{ success: boolean }>('/settings/setup-wizard', payload),
};
