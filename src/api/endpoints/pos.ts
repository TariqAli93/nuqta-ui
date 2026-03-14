/**
 * POS API endpoints.
 *
 * Replaces: ipc/posClient.ts
 *
 * TODO: This endpoint is not in the current backend API spec.
 */
import type { ApiResult } from '../contracts';
import { apiPost } from '../http';

type AfterPayPayload = {
  saleId: number;
  printerName?: string;
};

type AfterPayResponse = {
  queued: boolean;
  printed: boolean;
  data: Record<string, unknown>;
};

export const posClient = {
  afterPay: (payload: AfterPayPayload): Promise<ApiResult<AfterPayResponse>> =>
    apiPost<AfterPayResponse>('/pos/after-pay', payload),
};
