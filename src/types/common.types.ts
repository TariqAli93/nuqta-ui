/**
 * Common shared types that mirror the backend's shared domain types.
 *
 * These complement the existing src/api/contracts.ts types and are
 * intended for use across all feature modules.
 */

// ── API response envelope ────────────────────────────────────────────────────

/** Re-export from api/contracts for convenience. */
export type { ApiError, ApiResult, PagedResult } from '../api/contracts';

// ── Pagination ───────────────────────────────────────────────────────────────

/**
 * Paginated result shape returned by CQRS read-side query handlers.
 * Mirrors the backend's PaginatedResult<T> interface.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Domain errors ────────────────────────────────────────────────────────────

/**
 * Typed representation of a backend DomainError as received by the frontend.
 * The backend sends { ok: false, error: { code, message, details? } }.
 */
export interface DomainError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status?: number;
}

// Well-known error codes emitted by the backend:
export const DOMAIN_ERROR_CODES = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  OPTIMISTIC_LOCK: 'OPTIMISTIC_LOCK',
  INVALID_STATE: 'INVALID_STATE',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
} as const;

export type DomainErrorCode =
  (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES];

/**
 * Returns true when the given error is an InsufficientStockError from the backend.
 * The details field contains `{ available, requested }`.
 */
export function isInsufficientStockError(
  error: DomainError | undefined | null
): error is DomainError & { details: { available: number; requested: number } } {
  const details = error?.details;

  return (
    error?.code === DOMAIN_ERROR_CODES.INSUFFICIENT_STOCK &&
    details !== null &&
    typeof details === 'object' &&
    typeof (details as Record<string, unknown>).available === 'number' &&
    typeof (details as Record<string, unknown>).requested === 'number'
  );
}

// ── Utility helpers ──────────────────────────────────────────────────────────

/** Convert a PagedResult (items/total) to a PaginatedResult (data/page/pageSize). */
export function toPaginatedResult<T>(
  pagedResult: { items: T[]; total: number },
  page = 1,
  pageSize: number
): PaginatedResult<T> {
  return {
    data: pagedResult.items,
    total: pagedResult.total,
    page,
    pageSize,
  };
}
