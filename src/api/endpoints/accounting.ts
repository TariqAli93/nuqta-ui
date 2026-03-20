/**
 * Accounting API endpoints.
 *
 * Replaces: ipc/accountingClient.ts
 *
 * Backend trial-balance row shape:
 *   { accountId, accountCode, accountName, accountType, debit, credit, balance }
 *
 * Note: Journal entries are immutable once created (accounting integrity).
 * Only account metadata can be updated via PUT /accounting/accounts/:id.
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Account, JournalEntry } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost, apiPut } from '../http';

/**
 * Matches backend TrialBalanceRowSchema exactly:
 *   { accountId, accountCode, accountName, accountType, debit, credit, balance }
 */
export interface TrialBalanceRow {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ProfitLossReport {
  revenue: { accountId: number; name: string; amount: number }[];
  expenses: { accountId: number; name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheetReport {
  assets: { accountId: number; name: string; balance: number }[];
  liabilities: { accountId: number; name: string; balance: number }[];
  equity: { accountId: number; name: string; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  equityAccounts: number;
  revenueNet: number;
  expenseNet: number;
  currentEarnings: number;
  totalEquity: number;
  difference: number;
}

export interface LedgerEntry {
  id: number;
  entryDate: string;
  entryNumber: string;
  journalEntryId: number;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export const accountingClient = {
  getAccounts: (): Promise<ApiResult<Account[]>> => apiGet<Account[]>('/accounting/accounts'),

  getJournalEntries: (params?: {
    sourceType?: string;
    sourceId?: number;
    dateFrom?: string;
    dateTo?: string;
    isPosted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<JournalEntry>>> =>
    apiGetPaged<JournalEntry>('/accounting/journal-entries', params),

  getEntryById: (id: number): Promise<ApiResult<JournalEntry | null>> =>
    apiGet<JournalEntry | null>(`/accounting/journal-entries/${id}`),

  getTrialBalance: (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResult<TrialBalanceRow[]>> =>
    apiGet<TrialBalanceRow[]>('/accounting/trial-balance', params),

  getProfitLoss: (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResult<ProfitLossReport>> =>
    apiGet<ProfitLossReport>('/accounting/profit-loss', params),

  getBalanceSheet: (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<ApiResult<BalanceSheetReport>> =>
    apiGet<BalanceSheetReport>('/accounting/balance-sheet', params),

  createEntry: (data: {
    entryDate: string;
    description: string;
    notes?: string;
    currency?: string;
    lines: { accountId: number; debit: number; credit: number; description?: string }[];
  }): Promise<ApiResult<JournalEntry>> =>
    apiPost<JournalEntry>('/accounting/journal-entries', data),

  /**
   * Update account metadata (name, nameAr, accountType, parentId, isActive).
   * Backend: PUT /accounting/accounts/:id
   */
  updateAccount: (
    id: number,
    data: Partial<{
      name: string;
      nameAr: string;
      accountType: Account['accountType'];
      parentId: number | null;
      isActive: boolean;
    }>
  ): Promise<ApiResult<Account>> => apiPut<Account>(`/accounting/accounts/${id}`, data),

  /**
   * Reconcile journal lines (AR/AP matching).
   * POST /accounting/reconcile
   */
  reconcile: (data: {
    journalLineIds: number[];
    amounts?: number[];
    notes?: string;
  }): Promise<ApiResult<any>> =>
    apiPost<any>('/accounting/reconcile', data),

  /**
   * Unreconcile a reconciliation record.
   * POST /accounting/unreconcile
   */
  unreconcile: (reconciliationId: number): Promise<ApiResult<any>> =>
    apiPost<any>('/accounting/unreconcile', { reconciliationId }),

  /**
   * List reconciliation records.
   * GET /accounting/reconciliations
   */
  getReconciliations: (params?: {
    accountId?: number;
    partnerId?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<any>>> =>
    apiGetPaged<any>('/accounting/reconciliations', params),

  /**
   * List unreconciled journal lines.
   * GET /accounting/unreconciled-lines
   */
  getUnreconciledLines: (params?: {
    accountCode?: string;
    partnerId?: number;
  }): Promise<ApiResult<any[]>> =>
    apiGet<any[]>('/accounting/unreconciled-lines', params),

  getAccountLedger: async (
    accountId: number,
    params?: {
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ApiResult<LedgerEntry[]>> => {
    const result = await apiGetPaged<JournalEntry>('/accounting/journal-entries', {
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      limit: 500,
      offset: 0,
    });

    if (!result.ok) return result as unknown as ApiResult<LedgerEntry[]>;

    const ledger: LedgerEntry[] = [];
    let runningBalance = 0;

    const sorted = [...result.data.items].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    for (const entry of sorted) {
      if (!entry.lines) continue;
      for (const line of entry.lines) {
        if (line.accountId !== accountId) continue;
        const debit = line.debit ?? 0;
        const credit = line.credit ?? 0;
        runningBalance += debit - credit;
        ledger.push({
          id: line.id ?? entry.id ?? 0,
          entryDate: entry.entryDate,
          entryNumber: entry.entryNumber,
          journalEntryId: entry.id ?? 0,
          description: line.description || entry.description,
          debit,
          credit,
          runningBalance,
        });
      }
    }

    return { ok: true, data: ledger };
  },

  createAccount: (data: {
    code: string;
    name: string;
    nameAr: string;
    accountType: Account['accountType'];
    parentId?: number | null;
  }): Promise<ApiResult<Account>> => apiPost<Account>('/accounting/accounts', data),
};
