/**
 * Customer Ledger API endpoints.
 *
 * Replaces: ipc/customerLedgerClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { CustomerLedgerEntry } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost } from '../http';

interface RecordPaymentInput {
  customerId: number; // used as URL path param, NOT sent in body
  amount: number;
  paymentMethod: string;
  notes?: string;
  idempotencyKey?: string;
}

interface LedgerAdjustmentInput {
  customerId: number; // used as URL path param, NOT sent in body
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

  recordPayment: (data: RecordPaymentInput): Promise<ApiResult<CustomerLedgerEntry>> => {
    const { customerId, ...body } = data;
    return apiPost<CustomerLedgerEntry>(`/customer-ledger/${customerId}/payments`, body);
  },

  addAdjustment: (data: LedgerAdjustmentInput): Promise<ApiResult<CustomerLedgerEntry>> => {
    const { customerId, ...body } = data;
    return apiPost<CustomerLedgerEntry>(`/customer-ledger/${customerId}/adjustments`, body);
  },

  reconcileDebt: (repair = false): Promise<ApiResult<any>> =>
    apiPost<any>('/customer-ledger/reconcile', { repair }),
};
