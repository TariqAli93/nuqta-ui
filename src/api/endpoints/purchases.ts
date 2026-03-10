/**
 * Purchases API endpoints.
 *
 * Replaces: ipc/purchasesClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Purchase } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost } from '../http';

export interface PurchaseCreateInput {
  invoiceNumber: string;
  supplierId: number;
  items: {
    productId: number;
    unitName: string;
    unitFactor: number;
    quantity: number;
    unitCost: number;
    discount?: number;
    batchNumber?: string;
    expiryDate?: string;
  }[];
  discount?: number;
  tax?: number;
  paidAmount?: number;
  currency?: string;
  notes?: string;
  idempotencyKey?: string;
}

interface PurchasePaymentInput {
  purchaseId: number;
  supplierId?: number;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | string;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
  currency?: string;
  exchangeRate?: number;
  idempotencyKey?: string;
}

export const purchasesClient = {
  getAll: (params?: {
    search?: string;
    supplierId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Purchase>>> => apiGetPaged<Purchase>('/purchases/', params),

  getById: (id: number): Promise<ApiResult<Purchase | null>> =>
    apiGet<Purchase | null>(`/purchases/${id}`),

  create: (data: PurchaseCreateInput): Promise<ApiResult<Purchase>> =>
    apiPost<Purchase>('/purchases/', data),

  addPayment: (data: PurchasePaymentInput): Promise<ApiResult<Purchase>> =>
    apiPost<Purchase>(`/purchases/${data.purchaseId}/payments`, data),
};
