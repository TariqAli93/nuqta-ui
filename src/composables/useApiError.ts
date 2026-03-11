/**
 * Composable for handling API errors with Arabic-localized messages.
 * Maps error codes to user-friendly notifications.
 */
import { useRouter } from 'vue-router';
import type { ApiError, ApiResult } from '@/api/contracts';
import { ErrorCodes } from '@/api/error-codes';
import { t } from '@/i18n/t';

/** Map error codes to Arabic translation keys */
const errorCodeMap: Record<string, string> = {
  [ErrorCodes.VALIDATION_ERROR]: 'errors.invalidData',
  [ErrorCodes.NOT_FOUND]: 'errors.loadFailed',
  [ErrorCodes.UNAUTHORIZED]: 'auth.sessionExpired',
  [ErrorCodes.PERMISSION_DENIED]: 'errors.noPermission',
  [ErrorCodes.CONFLICT]: 'errors.saveFailed',
  [ErrorCodes.INSUFFICIENT_STOCK]: 'errors.insufficientStock',
  [ErrorCodes.INVALID_STATE]: 'errors.invalidData',
  [ErrorCodes.RATE_LIMITED]: 'errors.rateLimited',
  [ErrorCodes.NETWORK_ERROR]: 'errors.loadFailed',
  [ErrorCodes.TIMEOUT]: 'errors.loadFailed',
  [ErrorCodes.INTERNAL_ERROR]: 'errors.unexpected',
  [ErrorCodes.DATABASE_ERROR]: 'errors.unexpected',
  [ErrorCodes.UNKNOWN]: 'errors.unexpected',
};

export function useApiError() {
  const router = useRouter();

  /**
   * Get a user-friendly Arabic message for an API error.
   */
  function getErrorMessage(error: ApiError): string {
    const key = errorCodeMap[error.code];
    if (key) return t(key);
    return error.message || t('errors.unexpected');
  }

  /**
   * Handle an API error appropriately:
   * - Auth errors → redirect to login
   * - Validation errors → return field details
   * - Others → return localized message
   */
  function handleError(result: ApiResult<unknown>): {
    message: string;
    details?: unknown;
    isAuth: boolean;
  } {
    if (result.ok) return { message: '', isAuth: false };

    const { error } = result;

    // Auth errors → redirect
    if (error.code === ErrorCodes.UNAUTHORIZED) {
      router.push('/auth/login');
      return { message: getErrorMessage(error), isAuth: true };
    }

    // Permission errors
    if (error.code === ErrorCodes.PERMISSION_DENIED) {
      return { message: getErrorMessage(error), isAuth: false };
    }

    // Validation errors with field details
    if (error.code === ErrorCodes.VALIDATION_ERROR && error.details) {
      return {
        message: getErrorMessage(error),
        details: error.details,
        isAuth: false,
      };
    }

    return { message: getErrorMessage(error), isAuth: false };
  }

  return { getErrorMessage, handleError };
}
