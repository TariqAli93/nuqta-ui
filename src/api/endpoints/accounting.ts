/**
 * Accounting API endpoints.
 *
 * Replaces: ipc/accountingClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Account, JournalEntry } from '../../types/domain';
import { apiGet, apiGetPaged } from '../http';

export interface TrialBalanceRow {
  accountId: number;
  code: string;
  name: string;
  accountType: string;
  debitTotal: number;
  creditTotal: number;
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
};
