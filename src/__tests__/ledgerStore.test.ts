/**
 * Tests for apps/ui/src/stores/ledgerStore.ts
 *
 * Covers:
 * - Initial state (granular loading object, isBusy computed)
 * - fetchCustomers / fetchSuppliers: separate loading keys, success, failure
 * - fetchCustomerLedger: sets selectedCustomerId, entries, total
 * - fetchSupplierLedger: sets selectedSupplierId, entries, total
 * - reconcileCustomerDebt / reconcileSupplierBalance: repair flag, loading.reconciliation
 * - isBusy: true while any loading key is true, false otherwise
 *
 * NOTE: ledgerStore imports all 4 clients from '@/api' barrel.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLedgerStore } from '@/stores/ledgerStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockCustomer,
  createMockSupplier,
  createMockCustomerLedgerEntry,
  createMockSupplierLedgerEntry,
} from './factories';

vi.mock('@/api', () => ({
  customersClient: {
    getAll: vi.fn(),
  },
  suppliersClient: {
    getAll: vi.fn(),
  },
  customerLedgerClient: {
    getLedger: vi.fn(),
    reconcileDebt: vi.fn(),
  },
  supplierLedgerClient: {
    getLedger: vi.fn(),
    reconcileBalance: vi.fn(),
  },
}));

describe('ledgerStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty collections and all loading flags false', () => {
    const store = useLedgerStore();
    expect(store.customers).toEqual([]);
    expect(store.suppliers).toEqual([]);
    expect(store.customerLedgerEntries).toEqual([]);
    expect(store.supplierLedgerEntries).toEqual([]);
    expect(store.loading.customers).toBe(false);
    expect(store.loading.suppliers).toBe(false);
    expect(store.loading.customerLedger).toBe(false);
    expect(store.loading.supplierLedger).toBe(false);
    expect(store.loading.reconciliation).toBe(false);
    expect(store.isBusy).toBe(false);
    expect(store.error).toBeNull();
  });

  it('selectedCustomerId and selectedSupplierId start null', () => {
    const store = useLedgerStore();
    expect(store.selectedCustomerId).toBeNull();
    expect(store.selectedSupplierId).toBeNull();
  });
});

describe('ledgerStore — fetchCustomers', () => {
  let store: ReturnType<typeof useLedgerStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLedgerStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates customers and sets customersTotal on success', async () => {
    const { customersClient } = await import('@/api');
    const customers = [createMockCustomer(), createMockCustomer({ id: 2, name: 'Fatima' })];
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult(customers, 2));

    await store.fetchCustomers();

    expect(store.customers).toHaveLength(2);
    expect(store.customersTotal).toBe(2);
    expect(store.loading.customers).toBe(false);
    expect(store.error).toBeNull();
  });

  it('uses loading.customers (not a single loading flag)', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchCustomers();
    expect(store.loading.customers).toBe(true);
    expect(store.loading.suppliers).toBe(false); // other keys unaffected
    await promise;
    expect(store.loading.customers).toBe(false);
  });

  it('isBusy is true while loading.customers is true', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchCustomers();
    expect(store.isBusy).toBe(true);
    await promise;
    expect(store.isBusy).toBe(false);
  });

  it('sets error on API failure', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Customers unavailable')
    );

    await store.fetchCustomers();

    expect(store.error).toBe('Customers unavailable');
    expect(store.loading.customers).toBe(false);
  });
});

describe('ledgerStore — fetchSuppliers', () => {
  let store: ReturnType<typeof useLedgerStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLedgerStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates suppliers and suppliersTotal on success', async () => {
    const { suppliersClient } = await import('@/api');
    const suppliers = [createMockSupplier(), createMockSupplier({ id: 2, name: 'Al-Rashid' })];
    vi.mocked(suppliersClient.getAll).mockResolvedValue(createPagedResult(suppliers, 2));

    await store.fetchSuppliers();

    expect(store.suppliers).toHaveLength(2);
    expect(store.suppliersTotal).toBe(2);
    expect(store.loading.suppliers).toBe(false);
  });

  it('uses loading.suppliers independently of loading.customers', async () => {
    const { suppliersClient } = await import('@/api');
    vi.mocked(suppliersClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchSuppliers();
    expect(store.loading.suppliers).toBe(true);
    expect(store.loading.customers).toBe(false);
    await promise;
    expect(store.loading.suppliers).toBe(false);
  });

  it('sets error on failure', async () => {
    const { suppliersClient } = await import('@/api');
    vi.mocked(suppliersClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Suppliers unavailable')
    );

    await store.fetchSuppliers();

    expect(store.error).toBe('Suppliers unavailable');
  });
});

describe('ledgerStore — fetchCustomerLedger', () => {
  let store: ReturnType<typeof useLedgerStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLedgerStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets selectedCustomerId and populates ledger entries on success', async () => {
    const { customerLedgerClient } = await import('@/api');
    const entries = [createMockCustomerLedgerEntry(), createMockCustomerLedgerEntry({ id: 2, amount: 2000 })];
    vi.mocked(customerLedgerClient.getLedger).mockResolvedValue(createPagedResult(entries, 2));

    await store.fetchCustomerLedger(42);

    expect(store.selectedCustomerId).toBe(42);
    expect(store.customerLedgerEntries).toHaveLength(2);
    expect(store.customerLedgerTotal).toBe(2);
    expect(store.loading.customerLedger).toBe(false);
  });

  it('uses loading.customerLedger flag', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.getLedger).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchCustomerLedger(1);
    expect(store.loading.customerLedger).toBe(true);
    await promise;
    expect(store.loading.customerLedger).toBe(false);
  });

  it('sets error on failure', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.getLedger).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Customer ledger not found')
    );

    await store.fetchCustomerLedger(99);

    expect(store.error).toBe('Customer ledger not found');
  });

  it('forwards customerId and date params to the client', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.getLedger).mockResolvedValue(createPagedResult([]));

    await store.fetchCustomerLedger(7, { dateFrom: '2025-01-01', limit: 20 });

    expect(customerLedgerClient.getLedger).toHaveBeenCalledWith(7, { dateFrom: '2025-01-01', limit: 20 });
  });
});

describe('ledgerStore — fetchSupplierLedger', () => {
  let store: ReturnType<typeof useLedgerStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLedgerStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets selectedSupplierId and populates ledger entries on success', async () => {
    const { supplierLedgerClient } = await import('@/api');
    const entries = [createMockSupplierLedgerEntry()];
    vi.mocked(supplierLedgerClient.getLedger).mockResolvedValue(createPagedResult(entries, 1));

    await store.fetchSupplierLedger(55);

    expect(store.selectedSupplierId).toBe(55);
    expect(store.supplierLedgerEntries).toHaveLength(1);
    expect(store.supplierLedgerTotal).toBe(1);
  });

  it('uses loading.supplierLedger flag independently', async () => {
    const { supplierLedgerClient } = await import('@/api');
    vi.mocked(supplierLedgerClient.getLedger).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchSupplierLedger(1);
    expect(store.loading.supplierLedger).toBe(true);
    expect(store.loading.customerLedger).toBe(false);
    await promise;
    expect(store.loading.supplierLedger).toBe(false);
  });

  it('sets error on failure', async () => {
    const { supplierLedgerClient } = await import('@/api');
    vi.mocked(supplierLedgerClient.getLedger).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Supplier ledger not found')
    );

    await store.fetchSupplierLedger(99);

    expect(store.error).toBe('Supplier ledger not found');
  });
});

describe('ledgerStore — reconcileCustomerDebt', () => {
  let store: ReturnType<typeof useLedgerStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLedgerStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets customerReconciliation on success', async () => {
    const { customerLedgerClient } = await import('@/api');
    const result = { fixed: 3, total: 10 };
    vi.mocked(customerLedgerClient.reconcileDebt).mockResolvedValue(createApiSuccess(result));

    await store.reconcileCustomerDebt();

    expect(store.customerReconciliation).toEqual(result);
    expect(store.loading.reconciliation).toBe(false);
  });

  it('uses loading.reconciliation flag', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.reconcileDebt).mockResolvedValue(createApiSuccess({}));

    const promise = store.reconcileCustomerDebt();
    expect(store.loading.reconciliation).toBe(true);
    await promise;
    expect(store.loading.reconciliation).toBe(false);
  });

  it('calls reconcileDebt with repair=true when requested', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.reconcileDebt).mockResolvedValue(createApiSuccess({}));

    await store.reconcileCustomerDebt(true);

    expect(customerLedgerClient.reconcileDebt).toHaveBeenCalledWith(true);
  });

  it('defaults repair to false', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.reconcileDebt).mockResolvedValue(createApiSuccess({}));

    await store.reconcileCustomerDebt();

    expect(customerLedgerClient.reconcileDebt).toHaveBeenCalledWith(false);
  });

  it('sets error on failure', async () => {
    const { customerLedgerClient } = await import('@/api');
    vi.mocked(customerLedgerClient.reconcileDebt).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Reconciliation failed')
    );

    await store.reconcileCustomerDebt();

    expect(store.error).toBe('Reconciliation failed');
  });
});

describe('ledgerStore — reconcileSupplierBalance', () => {
  let store: ReturnType<typeof useLedgerStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useLedgerStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets supplierReconciliation on success', async () => {
    const { supplierLedgerClient } = await import('@/api');
    const result = { fixed: 1, total: 5 };
    vi.mocked(supplierLedgerClient.reconcileBalance).mockResolvedValue(createApiSuccess(result));

    await store.reconcileSupplierBalance();

    expect(store.supplierReconciliation).toEqual(result);
    expect(store.loading.reconciliation).toBe(false);
  });

  it('calls reconcileBalance with repair flag', async () => {
    const { supplierLedgerClient } = await import('@/api');
    vi.mocked(supplierLedgerClient.reconcileBalance).mockResolvedValue(createApiSuccess({}));

    await store.reconcileSupplierBalance(true);

    expect(supplierLedgerClient.reconcileBalance).toHaveBeenCalledWith(true);
  });

  it('sets error on failure', async () => {
    const { supplierLedgerClient } = await import('@/api');
    vi.mocked(supplierLedgerClient.reconcileBalance).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Supplier reconciliation failed')
    );

    await store.reconcileSupplierBalance();

    expect(store.error).toBe('Supplier reconciliation failed');
  });
});
