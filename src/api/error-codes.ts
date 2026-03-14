/**
 * Standardized error codes — mirrors backend ErrorCodes.
 * Used by useApiError composable for error classification.
 *
 * Each code maps to a general HTTP status range for reference,
 * though the actual status is carried separately in ApiError.status.
 */
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 400 / 422
  NOT_FOUND: 'NOT_FOUND', // 404
  UNAUTHORIZED: 'UNAUTHORIZED', // 401
  PERMISSION_DENIED: 'PERMISSION_DENIED', // 403
  CONFLICT: 'CONFLICT', // 409
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK', // 409 / 422
  INVALID_STATE: 'INVALID_STATE', // 409 / 422
  RATE_LIMITED: 'RATE_LIMITED', // 429 — retryable (see http.ts)

  // Network/transport errors (no HTTP status)
  NETWORK_ERROR: 'NETWORK_ERROR', // 0 — no response received
  TIMEOUT: 'TIMEOUT', // 408 — ECONNABORTED / client timeout
  CANCELLED: 'CANCELLED', // 0 — AbortController signal

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR', // 500
  DATABASE_ERROR: 'DATABASE_ERROR', // 500

  // Generic fallback
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error codes that indicate the request may succeed on retry.
 * Used by UI composables to decide whether to show a "Retry" button.
 */
export const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set([
  ErrorCodes.NETWORK_ERROR,
  ErrorCodes.TIMEOUT,
  ErrorCodes.RATE_LIMITED,
  ErrorCodes.INTERNAL_ERROR,
  ErrorCodes.DATABASE_ERROR,
]);
