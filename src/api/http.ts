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
import type { ApiError, ApiMeta, ApiResult, PagedResult } from './contracts';
import { createFailure, normalizeApiError, normalizeApiResult, toPagedResult } from './contracts';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

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
// Request deduplication (Strategy 5)
// ---------------------------------------------------------------------------

/** In-flight GET requests — identical requests share the same Promise. */
const inflightRequests = new Map<string, Promise<unknown>>();

function dedupKey(url: string, params?: Record<string, unknown>): string {
  return `GET:${url}:${params ? JSON.stringify(params) : ''}`;
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff (Strategy 6)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 100;

/** Circuit breaker state */
let consecutiveFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 30_000;

function isCircuitOpen(): boolean {
  if (consecutiveFailures < CIRCUIT_FAILURE_THRESHOLD) return false;
  if (Date.now() > circuitOpenUntil) {
    // Half-open — allow one probe
    consecutiveFailures = CIRCUIT_FAILURE_THRESHOLD - 1;
    return false;
  }
  return true;
}

function recordSuccess(): void {
  consecutiveFailures = 0;
}

function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

function isRetryable(err: AxiosError): boolean {
  if (axios.isCancel(err)) {
    return false;
  }
  if (err.code === 'ECONNABORTED') {
    return false;
  }
  if (!err.response) {
    return false;
  }

  // Don't retry client errors (4xx) — they won't succeed on retry
  if (err.response && err.response.status >= 400 && err.response.status < 500) {
    return false;
  }

  // Retry on transient server failures.
  return err.response.status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  if (isCircuitOpen()) {
    throw new Error('Circuit breaker is open — requests are temporarily blocked');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (error) {
      const axErr = error as AxiosError;
      if (attempt < retries && isRetryable(axErr)) {
        recordFailure();
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      recordFailure();
      throw error;
    }
  }

  // Unreachable but TypeScript needs it
  throw new Error('Retry exhausted');
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

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function createMeta(startedAt: number): ApiMeta {
  return { durationMs: Math.round(nowMs() - startedAt) };
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const key = dedupKey(url, params);

  // Dedup: return in-flight request if one exists for the same key
  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight as Promise<ApiResult<T>>;
  }

  const request = (async (): Promise<ApiResult<T>> => {
    const startedAt = nowMs();
    try {
      const config: AxiosRequestConfig = { params };
      if (options?.signal) config.signal = options.signal;
      const response = await withRetry(() => http.get(url, config));
      return normalizeApiResult<T>(response.data, undefined, createMeta(startedAt));
    } catch (error) {
      if (axios.isCancel(error)) {
        return createFailure(
          { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
          createMeta(startedAt)
        );
      }
      const apiError = axiosErrorToApiError(error as AxiosError);
      handleUnauthorized(apiError);
      return createFailure(apiError, createMeta(startedAt));
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, request);
  return request;
}

export async function apiGetPaged<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<ApiResult<PagedResult<T>>> {
  const key = dedupKey(url + ':paged', params);

  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight as Promise<ApiResult<PagedResult<T>>>;
  }

  const request = (async (): Promise<ApiResult<PagedResult<T>>> => {
    const startedAt = nowMs();
    try {
      const config: AxiosRequestConfig = { params };
      if (options?.signal) config.signal = options.signal;
      const response = await withRetry(() => http.get(url, config));
      return normalizeApiResult<PagedResult<T>>(
        response.data,
        toPagedResult,
        createMeta(startedAt)
      );
    } catch (error) {
      if (axios.isCancel(error)) {
        return createFailure(
          { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
          createMeta(startedAt)
        );
      }
      const apiError = axiosErrorToApiError(error as AxiosError);
      handleUnauthorized(apiError);
      return createFailure(apiError, createMeta(startedAt));
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, request);
  return request;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const startedAt = nowMs();
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.post(url, data, config);
    return normalizeApiResult<T>(response.data, undefined, createMeta(startedAt));
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure(
        { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
        createMeta(startedAt)
      );
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError, createMeta(startedAt));
  }
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const startedAt = nowMs();
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.put(url, data, config);
    return normalizeApiResult<T>(response.data, undefined, createMeta(startedAt));
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure(
        { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
        createMeta(startedAt)
      );
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError, createMeta(startedAt));
  }
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const startedAt = nowMs();
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.patch(url, data, config);
    return normalizeApiResult<T>(response.data, undefined, createMeta(startedAt));
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure(
        { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
        createMeta(startedAt)
      );
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError, createMeta(startedAt));
  }
}

export async function apiDelete<T>(
  url: string,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const startedAt = nowMs();
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http.delete(url, config);
    return normalizeApiResult<T>(response.data, undefined, createMeta(startedAt));
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure(
        { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
        createMeta(startedAt)
      );
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    handleUnauthorized(apiError);
    return createFailure(apiError, createMeta(startedAt));
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
  inflightRequests.clear();
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}
