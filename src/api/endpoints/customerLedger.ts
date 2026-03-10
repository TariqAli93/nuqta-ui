/**
 * Customer Ledger API endpoints.
 *
 * Replaces: ipc/customerLedgerClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { CustomerLedgerEntry } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost } from '../http';

interface RecordPaymentInput {
  customerId: number;
  amount: number;
  paymentMethod: string;
  notes?: string;
  idempotencyKey?: string;
}

interface LedgerAdjustmentInput {
  customerId: number;
  amount: number;
  notes?: string;
}

export const customerLedgerClient = {
  getLedger: (
    customerId: number,
    params?: {
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResult<PagedResult<CustomerLedgerEntry>>> =>
    apiGetPaged<CustomerLedgerEntry>(`/customer-ledger/${customerId}`, params),

  recordPayment: (data: RecordPaymentInput): Promise<ApiResult<CustomerLedgerEntry>> =>
    apiPost<CustomerLedgerEntry>(`/customer-ledger/${data.customerId}/payments`, data),

  addAdjustment: (data: LedgerAdjustmentInput): Promise<ApiResult<CustomerLedgerEntry>> =>
    apiPost<CustomerLedgerEntry>(`/customer-ledger/${data.customerId}/adjustments`, data),

  reconcileDebt: (repair = false): Promise<ApiResult<any>> =>
    apiPost<any>('/customer-ledger/reconcile', { repair }),
};
