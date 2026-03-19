/**
 * Sales API endpoints.
 *
 * Replaces: ipc/salesClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Payment, Sale, SaleInput } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost } from '../http';

export const salesClient = {
  getAll: (params?: Record<string, unknown>): Promise<ApiResult<PagedResult<Sale>>> =>
    apiGetPaged<Sale>('/sales/', params),

  create: (sale: SaleInput): Promise<ApiResult<Sale>> => apiPost<Sale>('/sales/', sale),

  addPayment: (saleId: number, payment: Omit<Payment, 'saleId'>): Promise<ApiResult<Sale>> =>
    apiPost<Sale>(`/sales/${saleId}/payments`, payment),

  getById: (id: number): Promise<ApiResult<Sale>> => apiGet<Sale>(`/sales/${id}`),

  /** TODO: Backend endpoint not in current spec — add when available */
  cancel: (id: number): Promise<ApiResult<Sale>> => apiPost<Sale>(`/sales/${id}/cancel`),

  /** TODO: Backend endpoint not in current spec — add when available */
  refund: (id: number, amount: number, reason: string): Promise<ApiResult<Sale>> =>
    apiPost<Sale>(`/sales/${id}/refund`, {
      amount,
      reason,
    }),

  /** TODO: Backend endpoint not in current spec — add when available */
  generateReceipt: (id: number): Promise<ApiResult<{ receiptHtml: string }>> =>
    apiGet<{ receiptHtml: string }>(`/sales/${id}/receipt`),
};
