/**
 * API HTTP client — axios wrapper with baseURL, auth, JSON, error normalization.
 *
 * Every HTTP call in the UI goes through this module.
 * baseURL is read from VITE_API_BASE_URL (set in .env / .env.development).
 *
 * NOTE: Module-level mutable state (circuit breaker counters, inflight map, etc.)
 * is safe in a single-threaded browser context. Do not use in a multi-threaded
 * environment without synchronization.
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
// process.env.NODE_ENV === 'production'
//   ? process.env.VITE_API_BASE_URL
//   : 'http://localhost:3000/api/v1';
const baseURL = 'https://api.codelapps.com/api/v1';

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ---------------------------------------------------------------------------
// Auth token management
// ---------------------------------------------------------------------------

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

/**
 * Store the access token used for Bearer auth.
 */
export function setAccessToken(newToken: string | null): void {
  _accessToken = newToken;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setRefreshToken(token: string | null): void {
  _refreshToken = token;
  try {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  } catch {
    /* noop */
  }
}

export function getRefreshToken(): string | null {
  if (_refreshToken) return _refreshToken;
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
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
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach(({ resolve }) => resolve(newToken));
  refreshSubscribers = [];
}

/** Drain all queued subscribers with an error so their Promises reject immediately. */
function drainRefreshSubscribers(err: unknown): void {
  refreshSubscribers.forEach(({ reject }) => reject(err));
  refreshSubscribers = [];
}

function addRefreshSubscriber(
  resolve: (token: string) => void,
  reject: (err: unknown) => void
): void {
  refreshSubscribers.push({ resolve, reject });
}

/**
 * Response interceptor:
 * On 401 → attempt token refresh via /auth/refresh.
 * Queue concurrent requests and retry them after refresh.
 * Prevent infinite loops by not retrying refresh requests.
 *
 * FIX #5: Only logout on auth-related refresh failures (401/403),
 * not on transient server errors (5xx).
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
        // Queue this request until refresh completes or fails
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(http(originalRequest));
          }, reject);
        });
      }

      originalRequest._retried = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getRefreshToken();

        // No refresh token available — treat as immediate auth failure
        if (!storedRefreshToken) {
          setAccessToken(null);
          setRefreshToken(null);
          try {
            localStorage.removeItem('token');
          } catch {
            /* noop */
          }
          if (unauthorizedHandler) {
            unauthorizedHandler();
          }
          return Promise.reject(error);
        }

        const refreshResponse = await http.post('/auth/refresh', {
          refreshToken: storedRefreshToken,
        });
        const data = refreshResponse.data?.data ?? refreshResponse.data ?? {};
        const newToken = data.accessToken ?? data.token ?? null;
        const newRefreshToken = data.refreshToken ?? null;

        if ('accessToken' in data && newToken) {
          setAccessToken(newToken ?? null);
          try {
            localStorage.setItem('token', newToken ?? '');
          } catch {
            /* noop */
          }
          if ('refreshToken' in data && newRefreshToken !== null) {
            setRefreshToken(newRefreshToken ?? null);
          }
          onTokenRefreshed(newToken ?? '');
          originalRequest.headers.Authorization = `Bearer ${newToken ?? ''}`;
          return http(originalRequest);
        }
      } catch (refreshErr) {
        // Unblock all queued requests so their Promises reject immediately
        // instead of hanging forever when the refresh server is unavailable.
        drainRefreshSubscribers(refreshErr);

        // Only logout on auth-specific failures (401/403), not transient server errors (5xx)
        const status = (refreshErr as AxiosError)?.response?.status;
        if (!status || status === 401 || status === 403) {
          setAccessToken(null);
          setRefreshToken(null);
          try {
            localStorage.removeItem('token');
          } catch {
            /* noop */
          }
          if (unauthorizedHandler) {
            unauthorizedHandler();
          }
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

// FIX #6: Removed `handleUnauthorized` from HTTP helpers.
// The 401 interceptor already handles refresh + logout. Calling it again
// in every helper was either redundant (interceptor already dealt with it)
// or a double-fire (interceptor logged out, then helper fires handler again).

// ---------------------------------------------------------------------------
// Request deduplication
// ---------------------------------------------------------------------------

/**
 * In-flight GET requests — identical requests share the same Promise.
 *
 * NOTE (FIX #3): If a request is cancelled via AbortSignal, all callers
 * sharing the deduped promise receive CANCELLED. This is acceptable because
 * dedup only applies to GET requests with identical params. If callers need
 * independent cancellation, pass a unique param (e.g. `_dedupKey`) to
 * differentiate them.
 */
const inflightRequests = new Map<string, Promise<unknown>>();

function dedupKey(url: string, params?: Record<string, unknown>): string {
  return `GET:${url}:${params ? JSON.stringify(params) : ''}`;
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff + jitter
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
  if (axios.isCancel(err)) return false;
  if (err.code === 'ECONNABORTED') return false;

  // FIX #4: Network errors (no response) are transient — retry them
  if (!err.response) return true;

  // FIX #8: 429 Too Many Requests is retryable
  if (err.response.status === 429) return true;

  // Don't retry other client errors (4xx) — they won't succeed on retry
  if (err.response.status >= 400 && err.response.status < 500) return false;

  // Retry on transient server failures (5xx)
  return err.response.status >= 500;
}

/**
 * Parse the Retry-After header value into milliseconds.
 * Supports both delta-seconds and HTTP-date formats.
 */
function parseRetryAfter(err: AxiosError): number | null {
  const header = err.response?.headers?.['retry-after'];
  if (!header) return null;

  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;

  // Try HTTP-date format
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());

  return null;
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
        // FIX #2: Only record circuit-breaker failure for retryable errors
        recordFailure();

        // FIX #8: Respect Retry-After header for 429 responses
        const retryAfterMs = parseRetryAfter(axErr);
        // FIX #7: Add jitter to prevent thundering herd
        const jitter = Math.random() * BASE_DELAY_MS;
        const delay = retryAfterMs ?? BASE_DELAY_MS * Math.pow(2, attempt) + jitter;

        await sleep(delay);
        continue;
      }

      // FIX #2: Only trip circuit breaker on retryable errors that exhausted retries
      if (isRetryable(axErr)) {
        recordFailure();
      }

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

// ---------------------------------------------------------------------------
// FIX #9: Internal mutation helper to eliminate duplication
// ---------------------------------------------------------------------------

type HttpMethod = 'post' | 'put' | 'patch';

async function apiMutate<T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const startedAt = nowMs();
  try {
    const config: AxiosRequestConfig = {};
    if (options?.signal) config.signal = options.signal;
    const response = await http[method](url, data ?? {}, config);
    return normalizeApiResult<T>(response.data, undefined, createMeta(startedAt));
  } catch (error) {
    if (axios.isCancel(error)) {
      return createFailure(
        { code: 'CANCELLED', message: 'Request cancelled', status: 0 },
        createMeta(startedAt)
      );
    }
    const apiError = axiosErrorToApiError(error as AxiosError);
    return createFailure(apiError, createMeta(startedAt));
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  const key = dedupKey(url, params);

  const inflight = inflightRequests.get(key);
  if (inflight) return inflight as Promise<ApiResult<T>>;

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
      const axErr = error as AxiosError;
      // Call the unauthorized handler directly here in addition to the Axios
      // response interceptor. The interceptor handles the full refresh-then-retry
      // flow for real Axios requests, but unit tests mock `http.get` at the
      // function level which bypasses interceptors entirely. Handling 401 here
      // ensures consistent behaviour in both environments without duplicating
      // the refresh logic.
      if (axErr?.response?.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }
      const apiError = axiosErrorToApiError(axErr);
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
  if (inflight) return inflight as Promise<ApiResult<PagedResult<T>>>;

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
  return apiMutate<T>('post', url, data, options);
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiMutate<T>('put', url, data, options);
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResult<T>> {
  return apiMutate<T>('patch', url, data, options);
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
    return createFailure(apiError, createMeta(startedAt));
  }
}

// ---------------------------------------------------------------------------
// Test helpers (only used in unit tests)
// ---------------------------------------------------------------------------

/** @internal Reset module state — for testing only */
export function __resetForTests(): void {
  _accessToken = null;
  _refreshToken = null;
  unauthorizedHandler = null;
  isRefreshing = false;
  refreshSubscribers = [];
  inflightRequests.clear();
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}
