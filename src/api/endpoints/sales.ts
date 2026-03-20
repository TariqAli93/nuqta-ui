/**
 * Sales API endpoints.
 *
 * Replaces: ipc/salesClient.ts
 *
 * Backend response shapes:
 *   cancel:  { ok: true, data: null }
 *   refund:  { ok: true, data: { saleId, refundedAmount, newPaidAmount, newRemainingAmount } }
 *   receipt: { ok: true, data: SaleReceiptData }
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Payment, Sale, SaleCreateInput } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost } from '../http';

export interface RefundResult {
  saleId: number;
  refundedAmount: number;
  newPaidAmount: number;
  newRemainingAmount: number;
  totalRefunded?: number;
  status?: string;
}

export interface SaleReceiptStore {
  companyName: string;
  companyNameAr: string;
  phone: string;
  mobile: string;
  address: string;
  receiptWidth: string;
  footerNote: string;
}

export interface SaleReceiptParty {
  id: number | null;
  name: string;
  phone?: string;
}

export interface SaleReceiptItem {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  tax: number;
}

export interface SaleReceiptData {
  saleId: number;
  invoiceNumber: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  customer: SaleReceiptParty;
  cashier: { id: number | null; name: string };
  branch: { id: number | null; name: string };
  store: SaleReceiptStore;
  items: SaleReceiptItem[];
  receiptText?: string;
}

export const salesClient = {
  getAll: (params?: Record<string, unknown>): Promise<ApiResult<PagedResult<Sale>>> =>
    apiGetPaged<Sale>('/sales/', params),

  create: (sale: SaleCreateInput): Promise<ApiResult<Sale>> => apiPost<Sale>('/sales/', sale),

  addPayment: (saleId: number, payment: Omit<Payment, 'saleId'>): Promise<ApiResult<unknown>> =>
    apiPost<unknown>(`/sales/${saleId}/payments`, payment),

  getById: (id: number): Promise<ApiResult<Sale>> => apiGet<Sale>(`/sales/${id}`),

  /** Backend returns { ok: true, data: null } on success */
  cancel: (id: number): Promise<ApiResult<null>> =>
    apiPost<null>(`/sales/${id}/cancel`),

  /** Backend returns { saleId, refundedAmount, newPaidAmount, newRemainingAmount } */
  refund: (id: number, amount: number, reason?: string): Promise<ApiResult<RefundResult>> =>
    apiPost<RefundResult>(`/sales/${id}/refund`, { amount, reason }),

  generateReceipt: (id: number): Promise<ApiResult<SaleReceiptData>> =>
    apiGet<SaleReceiptData>(`/sales/${id}/receipt`),

  /** Settle outstanding credit balance for a sale */
  settle: (id: number, data: { amount: number; paymentMethod?: string; notes?: string }): Promise<ApiResult<Sale>> =>
    apiPost<Sale>(`/sales/${id}/settle`, data),
};
