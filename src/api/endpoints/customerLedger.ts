/**
 * Customer Ledger API endpoints.
 *
 * Replaces: ipc/customerLedgerClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { CustomerLedgerEntry, CustomerPaymentResult } from '../../types/domain';
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

  /**
   * Record a payment from customer profile.
   *
   * The backend allocates against open invoices and returns:
   * - ledgerEntry: the new ledger entry
   * - allocations: per-invoice settlement details (optional)
   * - creditAmount: overpayment stored as customer credit (optional)
   * - newBalance: updated customer balance (optional)
   *
   * If the backend returns only a plain CustomerLedgerEntry (old format),
   * we normalize it into a CustomerPaymentResult for consistent handling.
   */
  recordPayment: (data: RecordPaymentInput): Promise<ApiResult<CustomerPaymentResult>> => {
    const { customerId, ...body } = data;
    return apiPost<CustomerPaymentResult>(`/customer-ledger/${customerId}/payments`, body);
  },

  addAdjustment: (data: LedgerAdjustmentInput): Promise<ApiResult<CustomerLedgerEntry>> => {
    const { customerId, ...body } = data;
    return apiPost<CustomerLedgerEntry>(`/customer-ledger/${customerId}/adjustments`, body);
  },

  reconcileDebt: (repair = false): Promise<ApiResult<any>> =>
    apiPost<any>('/customer-ledger/reconcile', { repair }),
};
