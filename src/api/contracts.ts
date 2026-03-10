/**
 * UI-side API contract types and helpers.
 *
 * Identical interface to the old ipc/contracts.ts but with zero IPC dependencies.
 * Backend returns { ok: true, data: T } | { ok: false, error: ErrorDetail }.
 */

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface PagedResult<T> {
  items: T[];
  total: number;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export const createSuccess = <T>(data: T): ApiResult<T> => ({ ok: true, data });

export const createFailure = (error: ApiError): ApiResult<never> => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export const normalizeApiError = (error: unknown): ApiError => {
  if (!error) return { code: 'UNKNOWN', message: 'Unknown error' };

  if (typeof error === 'string') return { code: 'UNKNOWN', message: error };

  if (typeof error === 'object') {
    const err = error as {
      code?: string;
      message?: string;
      error?: string;
      details?: unknown;
      status?: number;
    };
    if (err.message || err.error) {
      return {
        code: err.code || 'UNKNOWN',
        message: err.message || err.error || 'Unknown error',
        details: err.details,
        status: err.status,
      };
    }
  }

  return { code: 'UNKNOWN', message: 'Unknown error' };
};

/**
 * Normalise a raw backend response into ApiResult<T>.
 *
 * Backend always returns { ok: true/false, data/error }.
 */
export const normalizeApiResult = <T>(response: any, mapData?: (data: any) => T): ApiResult<T> => {
  if (response === null || response === undefined) {
    return createFailure({ code: 'EMPTY_RESPONSE', message: 'Empty response' });
  }

  // Standard envelope
  if (response.ok === true && 'data' in response) {
    const data = mapData ? mapData(response.data) : response.data;
    return createSuccess(data as T);
  }

  if (response.ok === false && response.error) {
    return createFailure(normalizeApiError(response.error));
  }

  // Fallback: raw data without envelope
  const data = mapData ? mapData(response) : response;
  return createSuccess(data as T);
};

export const toPagedResult = <T>(input: any): PagedResult<T> => {
  const items =
    (Array.isArray(input?.items) && input.items) ||
    (Array.isArray(input?.data?.items) && input.data.items) ||
    (Array.isArray(input) && input) ||
    [];
  const total =
    (typeof input?.total === 'number' && input.total) ||
    (typeof input?.data?.total === 'number' && input.data.total) ||
    items.length;

  return { items, total } as PagedResult<T>;
};
