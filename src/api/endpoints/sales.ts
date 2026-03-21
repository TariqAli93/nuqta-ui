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

/** Strip payload to only backend-allowed fields (additionalProperties: false). */
function sanitizeSalePayload(input: SaleCreateInput): SaleCreateInput {
  const sanitized: SaleCreateInput = {
    items: input.items.map((item) => {
      const clean: SaleCreateInput['items'][number] = {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      };
      if (item.discount != null) clean.discount = item.discount;
      if (item.unitName != null) clean.unitName = item.unitName;
      if (item.unitFactor != null) clean.unitFactor = item.unitFactor;
      if (item.batchId != null) clean.batchId = item.batchId;
      return clean;
    }),
    paymentType: input.paymentType,
  };
  if (input.customerId != null) sanitized.customerId = input.customerId;
  if (input.discount != null) sanitized.discount = input.discount;
  if (input.tax != null) sanitized.tax = input.tax;
  if (input.paidAmount != null) sanitized.paidAmount = input.paidAmount;
  if (input.currency != null) sanitized.currency = input.currency;
  if (input.notes != null) sanitized.notes = input.notes;
  if (input.interestRate != null) sanitized.interestRate = input.interestRate;
  if (input.interestRateBps != null) sanitized.interestRateBps = input.interestRateBps;
  if (input.paymentMethod != null) sanitized.paymentMethod = input.paymentMethod;
  if (input.referenceNumber != null) sanitized.referenceNumber = input.referenceNumber;
  if (input.idempotencyKey != null) sanitized.idempotencyKey = input.idempotencyKey;
  return sanitized;
}

export interface RefundResult {
  saleId: number;
  refundedAmount: number;
  newPaidAmount: number;
  newRemainingAmount: number;
  totalRefunded?: number;
  status?: string;
}

export interface SettlePayload {
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'credit';
  referenceNumber?: string;
  notes?: string;
  idempotencyKey?: string;
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

  create: (sale: SaleCreateInput): Promise<ApiResult<Sale>> =>
    apiPost<Sale>('/sales/', sanitizeSalePayload(sale)),

  addPayment: (saleId: number, payment: Omit<Payment, 'saleId'>): Promise<ApiResult<unknown>> =>
    apiPost<unknown>(`/sales/${saleId}/payments`, payment),

  getById: (id: number): Promise<ApiResult<Sale>> => apiGet<Sale>(`/sales/${id}`),

  /** Backend returns { ok: true, data: null } on success */
  cancel: (id: number): Promise<ApiResult<null>> => apiPost<null>(`/sales/${id}/cancel`),

  /** Backend returns { saleId, refundedAmount, newPaidAmount, newRemainingAmount } */
  refund: (
    id: number,
    amount: number,
    reason?: string,
    returnToStock = true
  ): Promise<ApiResult<RefundResult>> =>
    apiPost<RefundResult>(`/sales/${id}/refund`, { amount, reason, returnToStock }),

  generateReceipt: (id: number): Promise<ApiResult<SaleReceiptData>> =>
    apiGet<SaleReceiptData>(`/sales/${id}/receipt`),

  /** Backend returns { ok: true, data: null } on success */
  settle: (id: number, payload?: SettlePayload): Promise<ApiResult<null>> =>
    apiPost<null>(`/sales/${id}/settle`, payload),
};
