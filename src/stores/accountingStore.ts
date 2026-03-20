import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  accountingClient,
  type TrialBalanceRow,
  type ProfitLossReport,
  type BalanceSheetReport,
  type LedgerEntry,
} from '../api/endpoints/accounting';
import { settingsClient } from '../api/endpoints/settings';
import type { Account, JournalEntry } from '../types/domain';

export interface AccountingSettings {
  autoPostOnSale: boolean;
  autoPostOnPurchase: boolean;
  enforceBalancedEntries: boolean;
  defaultCostMethod: string;
  fiscalYearStart: number;
}

const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  autoPostOnSale: true,
  autoPostOnPurchase: true,
  enforceBalancedEntries: true,
  defaultCostMethod: 'fifo',
  fiscalYearStart: 1,
};

export function parseFiscalYearStartMonth(value: unknown): number {
  if (typeof value === 'string') {
    const match = /^(\d{2})-01$/.exec(value.trim());
    if (match) {
      const month = Number.parseInt(match[1], 10);
      if (month >= 1 && month <= 12) return month;
    }
    const fallback = Number.parseInt(value, 10);
    if (fallback >= 1 && fallback <= 12) return fallback;
    return 1;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12) {
    return value;
  }
  return 1;
}

export const useAccountingStore = defineStore('accounting', () => {
  const accounts = ref<Account[]>([]);
  const journalEntries = ref<JournalEntry[]>([]);
  const journalTotal = ref(0);
  const currentEntry = ref<JournalEntry | null>(null);
  const trialBalance = ref<TrialBalanceRow[]>([]);
  const profitLoss = ref<ProfitLossReport | null>(null);
  const balanceSheet = ref<BalanceSheetReport | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const accountsLoaded = ref(false);
  const accountsLastFetchedAt = ref<number | null>(null);

  // ── Accounting settings (reactive, app-wide) ──
  const settings = ref<AccountingSettings>({ ...DEFAULT_ACCOUNTING_SETTINGS });
  const settingsLoaded = ref(false);

  async function fetchAccountingSettings(force = false): Promise<void> {
    if (settingsLoaded.value && !force) return;
    try {
      const result = await settingsClient.getTyped([
        'accounting.autoPostOnSale',
        'accounting.autoPostOnPurchase',
        'accounting.enforceBalancedEntries',
        'accounting.defaultCostMethod',
        'accounting.fiscalYearStart',
      ]);

      if (result.ok && result.data) {
        const d = result.data;
        if (typeof d['accounting.autoPostOnSale'] === 'boolean')
          settings.value.autoPostOnSale = d['accounting.autoPostOnSale'];
        if (typeof d['accounting.autoPostOnPurchase'] === 'boolean')
          settings.value.autoPostOnPurchase = d['accounting.autoPostOnPurchase'];
        if (typeof d['accounting.enforceBalancedEntries'] === 'boolean')
          settings.value.enforceBalancedEntries = d['accounting.enforceBalancedEntries'];
        if (typeof d['accounting.defaultCostMethod'] === 'string')
          settings.value.defaultCostMethod = d['accounting.defaultCostMethod'];
        if (d['accounting.fiscalYearStart'] != null) {
          settings.value.fiscalYearStart = parseFiscalYearStartMonth(
            d['accounting.fiscalYearStart']
          );
        }
        settingsLoaded.value = true;
      }
    } catch {
      // Non-fatal — defaults remain active
    }
  }

  function applySettings(updated: Partial<AccountingSettings>): void {
    settings.value = { ...settings.value, ...updated };
  }

  async function saveAccountingSettings(
    updated: AccountingSettings
  ): Promise<{ ok: boolean; error?: string }> {
    const month = parseFiscalYearStartMonth(updated.fiscalYearStart);

    try {
      const result = await settingsClient.setTyped({
        'accounting.autoPostOnSale': updated.autoPostOnSale,
        'accounting.autoPostOnPurchase': updated.autoPostOnPurchase,
        'accounting.enforceBalancedEntries': updated.enforceBalancedEntries,
        'accounting.defaultCostMethod': updated.defaultCostMethod,
        'accounting.fiscalYearStart': `${month.toString().padStart(2, '0')}-01`,
      });
      if (result.ok) {
        applySettings({ ...updated, fiscalYearStart: month });
        return { ok: true };
      }
      return { ok: false, error: result.error?.message ?? 'فشل في حفظ الإعدادات' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل في حفظ الإعدادات';
      return { ok: false, error: message };
    }
  }

  async function fetchAccounts(force = false) {
    if (accountsLoaded.value && !force) return { ok: true as const, data: accounts.value };
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getAccounts();
      if (result.ok) {
        accounts.value = result.data;
        accountsLoaded.value = true;
        accountsLastFetchedAt.value = Date.now();
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل الحسابات';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchJournalEntries(params?: {
    sourceType?: string;
    dateFrom?: string;
    dateTo?: string;
    isPosted?: boolean;
    limit?: number;
    offset?: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getJournalEntries(params);
      if (result.ok) {
        journalEntries.value = result.data.items;
        journalTotal.value = result.data.total;
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل القيود';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchEntryById(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getEntryById(id);
      if (result.ok) currentEntry.value = result.data;
      else error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل القيد';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchTrialBalance(params?: { dateFrom?: string; dateTo?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getTrialBalance(params);
      if (result.ok) trialBalance.value = result.data;
      else error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل ميزان المراجعة';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfitLoss(params?: { dateFrom?: string; dateTo?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getProfitLoss(params);
      if (result.ok) profitLoss.value = result.data;
      else error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل تقرير الأرباح والخسائر';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchBalanceSheet(params?: { fromDate?: string; toDate?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getBalanceSheet(params);
      if (result.ok) balanceSheet.value = result.data;
      else error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل الميزانية العمومية';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function createEntry(data: {
    entryDate: string;
    description: string;
    notes?: string;
    currency?: string;
    lines: { accountId: number; debit: number; credit: number; description?: string }[];
  }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.createEntry(data);
      if (!result.ok) error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في إنشاء القيد';
      return { ok: false as const, error: { code: 'CREATE_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function updateAccount(
    id: number,
    data: Partial<{
      name: string;
      nameAr: string;
      accountType: Account['accountType'];
      parentId: number | null;
      isActive: boolean;
    }>
  ) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.updateAccount(id, data);
      if (result.ok) {
        const idx = accounts.value.findIndex((a) => a.id === id);
        if (idx !== -1) accounts.value[idx] = result.data;
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحديث الحساب';
      return { ok: false as const, error: { code: 'UPDATE_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchAccountLedger(
    accountId: number,
    params?: { dateFrom?: string; dateTo?: string }
  ) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.getAccountLedger(accountId, params);
      if (!result.ok) error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل دفتر الأستاذ';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function createAccount(data: {
    code: string;
    name: string;
    nameAr: string;
    accountType: Account['accountType'];
    parentId?: number | null;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await accountingClient.createAccount(data);
      if (result.ok) accounts.value.push(result.data);
      else error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في إنشاء الحساب';
      return { ok: false as const, error: { code: 'CREATE_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  return {
    accounts,
    journalEntries,
    journalTotal,
    currentEntry,
    trialBalance,
    profitLoss,
    balanceSheet,
    loading,
    error,
    accountsLoaded,
    accountsLastFetchedAt,
    settings,
    settingsLoaded,
    fetchAccountingSettings,
    applySettings,
    saveAccountingSettings,
    fetchAccounts,
    fetchJournalEntries,
    fetchEntryById,
    fetchTrialBalance,
    fetchProfitLoss,
    fetchBalanceSheet,
    createEntry,
    updateAccount,
    fetchAccountLedger,
    createAccount,
  };
});
