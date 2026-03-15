/**
 * Composable for handling API errors with Arabic-localized messages.
 * Maps error codes to user-friendly notifications.
 */
import { useRouter } from 'vue-router';
import type { ApiError, ApiResult } from '@/api/contracts';
import { ErrorCodes } from '@/api/error-codes';
import { t } from '@/i18n/t';
import { notifyError, notifyWarn } from '@/utils/notify';

const errorCodeMap: Record<string, string> = {
  [ErrorCodes.VALIDATION_ERROR]: 'errors.invalidData',
  [ErrorCodes.NOT_FOUND]: 'errors.loadFailed',
  [ErrorCodes.UNAUTHORIZED]: 'auth.sessionExpired',
  [ErrorCodes.PERMISSION_DENIED]: 'errors.noPermission',
  [ErrorCodes.FORBIDDEN]: 'errors.noPermission',
  [ErrorCodes.CONFLICT]: 'errors.saveFailed',
  [ErrorCodes.INSUFFICIENT_STOCK]: 'errors.insufficientStock',
  [ErrorCodes.OPTIMISTIC_LOCK]: 'errors.optimisticLock',
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

  function getErrorMessage(error: ApiError): string {
    const key = errorCodeMap[error.code];
    if (key) return t(key);
    return error.message || t('errors.unexpected');
  }

  function handleError(
    result: ApiResult<unknown>,
    options?: {
      notify?: boolean;
      dedupeKey?: string;
    }
  ): {
    message: string;
    details?: unknown;
    isAuth: boolean;
  } {
    if (result.ok) return { message: '', isAuth: false };

    const { error } = result;
    const message = getErrorMessage(error);
    const notifyUser = options?.notify !== false;
    const dedupeKey = options?.dedupeKey ?? error.code;

    if (error.code === ErrorCodes.UNAUTHORIZED) {
      if (notifyUser) {
        notifyWarn(message, { dedupeKey });
      }
      void router.push('/auth/login');
      return { message, isAuth: true };
    }

    if (error.code === ErrorCodes.PERMISSION_DENIED) {
      if (notifyUser) {
        notifyWarn(message, { dedupeKey });
      }
      return { message, isAuth: false };
    }

    if (error.code === ErrorCodes.INSUFFICIENT_STOCK && error.details) {
      const d = error.details as Record<string, unknown>;
      const available = typeof d.available === 'number' ? d.available : null;
      const requested = typeof d.requested === 'number' ? d.requested : null;
      const detailMsg =
        available !== null && requested !== null
          ? `${t('errors.insufficientStock')} — ${t('errors.stockAvailable')}: ${available.toLocaleString()}, ${t('errors.stockRequested')}: ${requested.toLocaleString()}`
          : message;
      if (notifyUser) notifyError(detailMsg, { dedupeKey });
      return { message: detailMsg, details: error.details, isAuth: false };
    }

    if (error.code === ErrorCodes.OPTIMISTIC_LOCK) {
      const detailMsg = t('errors.optimisticLock');
      if (notifyUser) notifyWarn(detailMsg, { dedupeKey });
      return { message: detailMsg, isAuth: false };
    }

    if (error.code === ErrorCodes.VALIDATION_ERROR && error.details) {
      if (notifyUser) {
        notifyError(message, { dedupeKey });
      }
      return {
        message,
        details: error.details,
        isAuth: false,
      };
    }

    if (notifyUser) {
      const notifyFn = error.code === ErrorCodes.RATE_LIMITED ? notifyWarn : notifyError;
      notifyFn(message, { dedupeKey });
    }

    return { message, isAuth: false };
  }

  function handleErrorWithForbidden(
    result: ApiResult<unknown>,
    options?: {
      notify?: boolean;
      dedupeKey?: string;
    }
  ): {
    message: string;
    details?: unknown;
    isAuth: boolean;
  } {
    if (result?.error?.code === ErrorCodes.FORBIDDEN) {
      const patchedResult: ApiResult<unknown> = {
        ...result,
        error: {
          ...result.error,
          code: ErrorCodes.PERMISSION_DENIED,
        },
      };
      return handleError(patchedResult, options);
    }

    return handleError(result, options);
  }

  return { getErrorMessage, handleError: handleErrorWithForbidden };
}
