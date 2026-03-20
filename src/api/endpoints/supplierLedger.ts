/**
 * Supplier Ledger API endpoints.
 *
 * Replaces: ipc/supplierLedgerClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { SupplierLedgerEntry } from '../../types/domain';
import { apiGetPaged, apiPost } from '../http';

interface SupplierPaymentInput {
  supplierId: number; // used as URL path param, NOT sent in body
  amount: number;
  paymentMethod: string;
  notes?: string;
  idempotencyKey?: string;
}

export const supplierLedgerClient = {
  getLedger: (
    supplierId: number,
    params?: {
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResult<PagedResult<SupplierLedgerEntry>>> =>
    apiGetPaged<SupplierLedgerEntry>(`/supplier-ledger/${supplierId}`, params),

  recordPayment: (data: SupplierPaymentInput): Promise<ApiResult<SupplierLedgerEntry>> => {
    const { supplierId, ...body } = data;
    return apiPost<SupplierLedgerEntry>(`/supplier-ledger/${supplierId}/payments`, body);
  },

  reconcileBalance: (repair = false): Promise<ApiResult<any>> =>
    apiPost<any>('/supplier-ledger/reconcile', { repair }),
};
