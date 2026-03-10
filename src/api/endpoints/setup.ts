/**
 * Setup (Accounting) API endpoints.
 *
 * Replaces: ipc/setupClient.ts
 */
import type { ApiResult } from '../contracts';
import { apiGet, apiPost } from '../http';

export interface AccountingCodeSelections {
  cashAccountCode: string;
  inventoryAccountCode: string;
  arAccountCode: string;
  apAccountCode: string;
  salesRevenueAccountCode: string;
  cogsAccountCode: string;
}

export interface AccountingSetupStatus {
  enabled: boolean | null;
  seeded: boolean;
  missingCodes: string[];
  selectedCodes: AccountingCodeSelections;
  baseCurrency: string | null;
  warnings: string[];
}

interface SeedChartOfAccountsRequest {
  baseCurrency?: string;
  cashAccountCode?: string;
  inventoryAccountCode?: string;
  arAccountCode?: string;
  apAccountCode?: string;
  salesRevenueAccountCode?: string;
  cogsAccountCode?: string;
}

interface SeedChartOfAccountsResponse extends AccountingSetupStatus {
  message: string;
  createdCodes: string[];
  existingCodes: string[];
}

export const setupClient = {
  getAccountingSetupStatus: (): Promise<ApiResult<AccountingSetupStatus>> =>
    apiGet<AccountingSetupStatus>('/accounting/status'),

  setAccountingEnabled: (enabled: boolean): Promise<ApiResult<AccountingSetupStatus>> =>
    apiPost<AccountingSetupStatus>('/accounting/initialize', { enabled }),

  seedChartOfAccounts: (
    payload: SeedChartOfAccountsRequest = {}
  ): Promise<ApiResult<SeedChartOfAccountsResponse>> =>
    apiPost<SeedChartOfAccountsResponse>('/accounting/initialize', payload),
};
