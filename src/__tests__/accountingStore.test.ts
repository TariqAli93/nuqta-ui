/**
 * Tests for apps/ui/src/stores/accountingStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchAccounts: success, failure, loading, catch-and-return on throw
 * - fetchJournalEntries: success, failure, loading, params
 * - fetchEntryById: success (sets currentEntry), failure
 * - fetchTrialBalance: success, failure, loading
 * - fetchProfitLoss: success, failure
 * - fetchBalanceSheet: success, failure
 *
 * NOTE: accountingStore imports directly from '@/api/endpoints/accounting'.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAccountingStore } from '@/stores/accountingStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockAccount,
  createMockJournalEntry,
} from './factories';
import type {
  TrialBalanceRow,
  ProfitLossReport,
  BalanceSheetReport,
} from '@/api/endpoints/accounting';

vi.mock('@/api/endpoints/accounting', () => ({
  accountingClient: {
    getAccounts: vi.fn(),
    getJournalEntries: vi.fn(),
    getEntryById: vi.fn(),
    getTrialBalance: vi.fn(),
    getProfitLoss: vi.fn(),
    getBalanceSheet: vi.fn(),
  },
}));
vi.mock('@/api/endpoints/settings', () => ({
  settingsClient: {
    getTyped: vi.fn(),
    setTyped: vi.fn(),
  },
}));
// ── Helpers ──────────────────────────────────────────────────────────────────

const mockTrialRow = (): TrialBalanceRow => ({
  accountId: 1,
  code: '1000',
  name: 'Cash',
  accountType: 'asset',
  debitTotal: 50000,
  creditTotal: 20000,
  balance: 30000,
});

const mockProfitLoss = (): ProfitLossReport => ({
  revenue: [{ accountId: 4, name: 'Sales Revenue', amount: 100000 }],
  expenses: [{ accountId: 5, name: 'COGS', amount: 60000 }],
  totalRevenue: 100000,
  totalExpenses: 60000,
  netIncome: 40000,
});

const mockBalanceSheet = (): BalanceSheetReport => ({
  assets: [{ accountId: 1, name: 'Cash', balance: 50000 }],
  liabilities: [{ accountId: 2, name: 'AP', balance: 10000 }],
  equity: [{ accountId: 3, name: 'Capital', balance: 40000 }],
  totalAssets: 50000,
  totalLiabilities: 10000,
  equityAccounts: 40000,
  revenueNet: 0,
  expenseNet: 0,
  currentEarnings: 0,
  totalEquity: 40000,
  difference: 0,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('accountingStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty collections and null reports', () => {
    const store = useAccountingStore();
    expect(store.accounts).toEqual([]);
    expect(store.journalEntries).toEqual([]);
    expect(store.journalTotal).toBe(0);
    expect(store.currentEntry).toBeNull();
    expect(store.trialBalance).toEqual([]);
    expect(store.profitLoss).toBeNull();
    expect(store.balanceSheet).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('accountingStore — fetchAccounts', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets accounts on success', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    const accounts = [
      createMockAccount(),
      createMockAccount({ id: 2, code: '2000', name: 'AP', accountType: 'liability' }),
    ];
    vi.mocked(accountingClient.getAccounts).mockResolvedValue(createApiSuccess(accounts));

    await store.fetchAccounts();

    expect(store.accounts).toHaveLength(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true then false', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getAccounts).mockResolvedValue(createApiSuccess([]));

    const promise = store.fetchAccounts();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on API failure', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getAccounts).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Accounts unavailable')
    );

    await store.fetchAccounts();

    expect(store.error).toBe('Accounts unavailable');
    expect(store.loading).toBe(false);
  });

  it('catches thrown error and returns failure result', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getAccounts).mockRejectedValue(new Error('Network failure'));

    const result = await store.fetchAccounts();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FETCH_FAILED');
    }
    expect(store.error).toBe('Network failure');
    expect(store.loading).toBe(false);
  });
});

describe('accountingStore — fetchJournalEntries', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets journalEntries and journalTotal on success', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    const entries = [
      createMockJournalEntry(),
      createMockJournalEntry({ id: 2, entryNumber: 'JE-002' }),
    ];
    vi.mocked(accountingClient.getJournalEntries).mockResolvedValue(createPagedResult(entries, 2));

    await store.fetchJournalEntries();

    expect(store.journalEntries).toHaveLength(2);
    expect(store.journalTotal).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true then false', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getJournalEntries).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchJournalEntries();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getJournalEntries).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Journal unavailable')
    );

    await store.fetchJournalEntries();

    expect(store.error).toBe('Journal unavailable');
  });

  it('clears error before fetch', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    store.error = 'stale' as any;
    vi.mocked(accountingClient.getJournalEntries).mockResolvedValue(createPagedResult([]));

    await store.fetchJournalEntries();

    expect(store.error).toBeNull();
  });

  it('forwards filter params', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getJournalEntries).mockResolvedValue(createPagedResult([]));

    await store.fetchJournalEntries({ isPosted: true, sourceType: 'sale', limit: 10 });

    expect(accountingClient.getJournalEntries).toHaveBeenCalledWith({
      isPosted: true,
      sourceType: 'sale',
      limit: 10,
    });
  });
});

describe('accountingStore — fetchEntryById', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets currentEntry on success', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    const entry = createMockJournalEntry({ id: 5, entryNumber: 'JE-005' });
    vi.mocked(accountingClient.getEntryById).mockResolvedValue(createApiSuccess(entry));

    await store.fetchEntryById(5);

    expect(store.currentEntry).toEqual(entry);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getEntryById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Entry not found')
    );

    await store.fetchEntryById(999);

    expect(store.error).toBe('Entry not found');
    expect(store.currentEntry).toBeNull();
  });
});

describe('accountingStore — fetchTrialBalance', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets trialBalance on success', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    const rows = [mockTrialRow()];
    vi.mocked(accountingClient.getTrialBalance).mockResolvedValue(createApiSuccess(rows));

    await store.fetchTrialBalance();

    expect(store.trialBalance).toHaveLength(1);
    expect(store.trialBalance[0].balance).toBe(30000);
    expect(store.loading).toBe(false);
  });

  it('sets loading true then false', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getTrialBalance).mockResolvedValue(createApiSuccess([]));

    const promise = store.fetchTrialBalance();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getTrialBalance).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Trial balance failed')
    );

    await store.fetchTrialBalance();

    expect(store.error).toBe('Trial balance failed');
    expect(store.loading).toBe(false);
  });

  it('forwards date range params', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getTrialBalance).mockResolvedValue(createApiSuccess([]));

    await store.fetchTrialBalance({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });

    expect(accountingClient.getTrialBalance).toHaveBeenCalledWith({
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
    });
  });
});

describe('accountingStore — fetchProfitLoss', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets profitLoss on success', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    const report = mockProfitLoss();
    vi.mocked(accountingClient.getProfitLoss).mockResolvedValue(createApiSuccess(report));

    await store.fetchProfitLoss();

    expect(store.profitLoss?.netIncome).toBe(40000);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getProfitLoss).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'P&L unavailable')
    );

    await store.fetchProfitLoss();

    expect(store.error).toBe('P&L unavailable');
    expect(store.profitLoss).toBeNull();
  });
});

describe('accountingStore — fetchBalanceSheet', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets balanceSheet on success', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    const sheet = mockBalanceSheet();
    vi.mocked(accountingClient.getBalanceSheet).mockResolvedValue(createApiSuccess(sheet));

    await store.fetchBalanceSheet();

    expect(store.balanceSheet?.totalAssets).toBe(50000);
    expect(store.balanceSheet?.totalLiabilities).toBe(10000);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getBalanceSheet).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Balance sheet failed')
    );

    await store.fetchBalanceSheet();

    expect(store.error).toBe('Balance sheet failed');
    expect(store.balanceSheet).toBeNull();
  });

  it('forwards date range params', async () => {
    const { accountingClient } = await import('@/api/endpoints/accounting');
    vi.mocked(accountingClient.getBalanceSheet).mockResolvedValue(
      createApiSuccess(mockBalanceSheet())
    );

    await store.fetchBalanceSheet({ fromDate: '2025-01-01', toDate: '2025-12-31' });

    expect(accountingClient.getBalanceSheet).toHaveBeenCalledWith({
      fromDate: '2025-01-01',
      toDate: '2025-12-31',
    });
  });
});

describe('accountingStore — saveAccountingSettings', () => {
  let store: ReturnType<typeof useAccountingStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAccountingStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves settings via API and updates store state on success', async () => {
    const { settingsClient } = await import('@/api/endpoints/settings');
    vi.mocked(settingsClient.setTyped).mockResolvedValue(createApiSuccess({ ok: true as const }));

    const newSettings = {
      autoPostOnSale: false,
      autoPostOnPurchase: false,
      enforceBalancedEntries: false,
      defaultCostMethod: 'weighted_average',
      fiscalYearStart: 4,
    };

    const result = await store.saveAccountingSettings(newSettings);

    expect(result.ok).toBe(true);
    expect(store.settings.autoPostOnSale).toBe(false);
    expect(store.settings.defaultCostMethod).toBe('weighted_average');
    expect(store.settings.fiscalYearStart).toBe(4);
    expect(settingsClient.setTyped).toHaveBeenCalledWith({
      'accounting.autoPostOnSale': false,
      'accounting.autoPostOnPurchase': false,
      'accounting.enforceBalancedEntries': false,
      'accounting.defaultCostMethod': 'weighted_average',
      'accounting.fiscalYearStart': '04-01',
    });
  });

  it('returns error and does not update store on API failure', async () => {
    const { settingsClient } = await import('@/api/endpoints/settings');
    vi.mocked(settingsClient.setTyped).mockResolvedValue(
      createApiFailure('SAVE_FAILED', 'Save failed')
    );

    const original = { ...store.settings };
    const result = await store.saveAccountingSettings({
      ...store.settings,
      autoPostOnSale: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Save failed');
    expect(store.settings.autoPostOnSale).toBe(original.autoPostOnSale);
  });

  it('returns error when API throws', async () => {
    const { settingsClient } = await import('@/api/endpoints/settings');
    vi.mocked(settingsClient.setTyped).mockRejectedValue(new Error('Network error'));

    const result = await store.saveAccountingSettings(store.settings);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
