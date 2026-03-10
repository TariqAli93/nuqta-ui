/**
 * API HTTP client — axios wrapper with baseURL, auth, JSON, error normalization.
 *
 * Every HTTP call in the UI goes through this module.
 * baseURL is read from VITE_API_BASE_URL (set in .env / .env.development).
 */
import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, ApiResult, PagedResult } from './contracts';
import { createFailure, normalizeApiError, normalizeApiResult, toPagedResult } from './contracts';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Auth token management
// ---------------------------------------------------------------------------

let _accessToken: string | null = null;

/**
 * Store the access token used for Bearer auth.
 * FIX: Previously the parameter shadowed the module-level variable,
 * causing `token = token` (noop) — the token was never stored.
 */
export function setAccessToken(newToken: string | null): void {
  _accessToken = newToken;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// Request interceptor — attach Bearer token
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const currentToken = getAccessToken();
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Token refresh mechanism
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

/**
 * Response interceptor:
 * On 401 → attempt token refresh via /auth/refresh.
 * Queue concurrent requests and retry them after refresh.
 * Prevent infinite loops by not retrying refresh requests.
 * Logout on refresh failure.
 */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(http(originalRequest));
          });
        });
      }

      originalRequest._retried = true;
      isRefreshing = true;

      try {
        const refreshResponse = await http.post('/auth/refresh');
        const newToken =
          refreshResponse.data?.data?.accessToken ?? refreshResponse.data?.accessToken ?? null;

        if (newToken) {
          setAccessToken(newToken);
          try {
            localStorage.setItem('token', newToken);
          } catch {
            /* noop */
          }
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return http(originalRequest);
        }
      } catch {
        // Refresh failed — trigger logout
        setAccessToken(null);
        try {
          localStorage.removeItem('token');
        } catch {
          /* noop */
        }
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Unauthorized handler
// ---------------------------------------------------------------------------

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

function handleUnauthorized(error: ApiError): void {
  const isUnauthorized =
    error.status === 401 || error.code === 'UNAUTHORIZED' || error.code === 'AUTH_ERROR';
  if (isUnauthorized && unauthorizedHandler) {
    unauthorizedHandler();
  }
}

// ---------------------------------------------------------------------------
// Generic HTTP helpers returning ApiResult<T>
// ---------------------------------------------------------------------------

function axiosErrorToApiError(err: AxiosError<unknown>): ApiError {
  const axErr = err as AxiosError<{ error?: Record<string, unknown>; [k: string]: unknown }>;
  if (axErr.response?.data && typeof axErr.response.data === 'object') {
    const body = axErr.response.data;
    if (body.error) {
      return normalizeApiError({ ...body.error, status: axErr.response.status });
    }
    return normalizeApiError({ ...body, status: axErr.response.status });
  }
  if (err.code === 'ECONNABORTED') {
    return { code: 'TIMEOUT', message: 'Request timed out', status: 408 };
  }
  if (!err.response) {
    return { code: 'NETWORK_ERROR', message: 'Network error — is the backend running?', status: 0 };
  }
  return normalizeApiError(err);
}

/** Options for API request helpers — supports AbortController signals. */
interface ApiRequestOptions {
  signal?: AbortSignal;
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  try {
    const config: AxiosRequestConfig = { params };
    if (options?.signal) config.signal = options.signal;
    const response = await http.get(url, config);
    return normalizeApiResult<T>(response.data);
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure({ code: 'CANCELLED', message: 'Request cancelled', status: 0 });
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError);
  }
}

export async function apiGetPaged<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<ApiResult<PagedResult<T>>> {
  try {
    const config: AxiosRequestConfig = { params };
    if (options?.signal) config.signal = options.signal;
    const response = await http.get(url, config);
    return normalizeApiResult<PagedResult<T>>(response.data, toPagedResult);
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure({ code: 'CANCELLED', message: 'Request cancelled', status: 0 });
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError);
  }
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.post(url, data, config);
    return normalizeApiResult<T>(response.data);
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure({ code: 'CANCELLED', message: 'Request cancelled', status: 0 });
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError);
  }
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.put(url, data, config);
    return normalizeApiResult<T>(response.data);
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure({ code: 'CANCELLED', message: 'Request cancelled', status: 0 });
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError);
  }
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.patch(url, data, config);
    return normalizeApiResult<T>(response.data);
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure({ code: 'CANCELLED', message: 'Request cancelled', status: 0 });
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError);
  }
}

export async function apiDelete<T>(
  url: string,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.delete(url, config);
    return normalizeApiResult<T>(response.data);
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure({ code: 'CANCELLED', message: 'Request cancelled', status: 0 });
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError);
  }
}

// ---------------------------------------------------------------------------
// Test helpers (only used in unit tests)
// ---------------------------------------------------------------------------

/** @internal Reset module state — for testing only */
export function __resetForTests(): void {
  _accessToken = null;
  unauthorizedHandler = null;
  isRefreshing = false;
  refreshSubscribers = [];
}
