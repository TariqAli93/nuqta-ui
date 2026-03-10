/**
 * Tests for apps/ui/src/stores/inventoryStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchDashboard: success (sets dashboard), failure
 * - fetchMovements: success (sets movements + total), failure, params forwarding
 * - fetchExpiryAlerts: success (sets expiryAlerts), no loading transition
 * - adjustStock: success, failure, loading transitions
 * - reconcileStock: success (sets reconciliation), failure, repair flag
 *
 * NOTE: inventoryStore imports directly from '@/api/endpoints/inventory'.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryStore } from '@/stores/inventoryStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockMovement as createMockInventoryMovement,
} from './factories';
import type {
  InventoryDashboard,
  ExpiryAlert,
  StockReconciliationResult,
} from '@/api/endpoints/inventory';

vi.mock('@/api/endpoints/inventory', () => ({
  inventoryClient: {
    getDashboard: vi.fn(),
    getMovements: vi.fn(),
    getExpiryAlerts: vi.fn(),
    adjustStock: vi.fn(),
    reconcileStock: vi.fn(),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockDashboard = (): InventoryDashboard => ({
  totalValuation: 500000,
  lowStockCount: 3,
  expiryAlertCount: 1,
  topMovingProducts: [{ productId: 1, productName: 'Widget', totalMoved: 200 }],
});

const mockExpiryAlert = (): ExpiryAlert => ({
  productId: 1,
  productName: 'Perishable',
  batchNumber: 'BATCH-001',
  expiryDate: '2026-01-01',
  quantityOnHand: 20,
  daysUntilExpiry: 10,
});

const mockReconciliation = (): StockReconciliationResult => ({
  driftItems: [],
  totalProducts: 50,
  totalDrift: 0,
  repairedCount: 0,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('inventoryStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with null dashboard, empty movements, no error', () => {
    const store = useInventoryStore();
    expect(store.dashboard).toBeNull();
    expect(store.movements).toEqual([]);
    expect(store.movementsTotal).toBe(0);
    expect(store.expiryAlerts).toEqual([]);
    expect(store.reconciliation).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('inventoryStore — fetchDashboard', () => {
  let store: ReturnType<typeof useInventoryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInventoryStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets dashboard on success', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    const dash = mockDashboard();
    vi.mocked(inventoryClient.getDashboard).mockResolvedValue(createApiSuccess(dash));

    await store.fetchDashboard();

    expect(store.dashboard).toEqual(dash);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true during fetch', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.getDashboard).mockResolvedValue(createApiSuccess(mockDashboard()));

    const promise = store.fetchDashboard();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.getDashboard).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Dashboard unavailable')
    );

    await store.fetchDashboard();

    expect(store.error).toBe('Dashboard unavailable');
    expect(store.dashboard).toBeNull();
    expect(store.loading).toBe(false);
  });
});

describe('inventoryStore — fetchMovements', () => {
  let store: ReturnType<typeof useInventoryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInventoryStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets movements and total on success', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    const movements = [
      createMockInventoryMovement(),
      createMockInventoryMovement({ id: 2, movementType: 'out', reason: 'sale' }),
    ];
    vi.mocked(inventoryClient.getMovements).mockResolvedValue(createPagedResult(movements, 2));

    await store.fetchMovements();

    expect(store.movements).toHaveLength(2);
    expect(store.movementsTotal).toBe(2);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.getMovements).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Movements unavailable')
    );

    await store.fetchMovements();

    expect(store.error).toBe('Movements unavailable');
  });

  it('forwards product/type filter params', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.getMovements).mockResolvedValue(createPagedResult([]));

    await store.fetchMovements({ productId: 5, movementType: 'in', limit: 25 });

    expect(inventoryClient.getMovements).toHaveBeenCalledWith({
      productId: 5,
      movementType: 'in',
      limit: 25,
    });
  });

  it('clears error before new fetch', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    store.error = 'stale error' as any;
    vi.mocked(inventoryClient.getMovements).mockResolvedValue(createPagedResult([]));

    await store.fetchMovements();

    expect(store.error).toBeNull();
  });
});

describe('inventoryStore — fetchExpiryAlerts', () => {
  let store: ReturnType<typeof useInventoryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInventoryStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets expiryAlerts on success', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    const alerts = [mockExpiryAlert()];
    vi.mocked(inventoryClient.getExpiryAlerts).mockResolvedValue(createApiSuccess(alerts));

    await store.fetchExpiryAlerts(10);

    expect(store.expiryAlerts).toHaveLength(1);
    expect(store.expiryAlerts[0].productName).toBe('Perishable');
  });

  it('does NOT toggle loading (lightweight background refresh)', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.getExpiryAlerts).mockResolvedValue(createApiSuccess([]));

    expect(store.loading).toBe(false);
    const promise = store.fetchExpiryAlerts();
    // loading should remain false throughout — this is intentional
    expect(store.loading).toBe(false);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('does not overwrite alerts on failure (silent fail)', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    store.expiryAlerts = [mockExpiryAlert()];
    vi.mocked(inventoryClient.getExpiryAlerts).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Expiry check failed')
    );

    await store.fetchExpiryAlerts();

    expect(store.expiryAlerts).toHaveLength(1); // unchanged on failure
  });
});

describe('inventoryStore — adjustStock', () => {
  let store: ReturnType<typeof useInventoryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInventoryStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.adjustStock).mockResolvedValue(
      createApiSuccess(createMockInventoryMovement())
    );

    const result = await store.adjustStock({
      productId: 1,
      reason: 'manual',
      quantityBase: 5,
      notes: 'Manual correction',
    });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true during adjustment', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.adjustStock).mockResolvedValue(
      createApiSuccess(createMockInventoryMovement())
    );

    const promise = store.adjustStock({ productId: 1, reason: 'damage', quantityBase: -2 });
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.adjustStock).mockResolvedValue(
      createApiFailure('INSUFFICIENT_STOCK', 'Cannot reduce below zero')
    );

    await store.adjustStock({ productId: 1, reason: 'damage', quantityBase: -999 });

    expect(store.error).toBe('Cannot reduce below zero');
    expect(store.loading).toBe(false);
  });
});

describe('inventoryStore — reconcileStock', () => {
  let store: ReturnType<typeof useInventoryStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useInventoryStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets reconciliation on success', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    const result = mockReconciliation();
    vi.mocked(inventoryClient.reconcileStock).mockResolvedValue(createApiSuccess(result));

    await store.reconcileStock();

    expect(store.reconciliation).toEqual(result);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('calls reconcileStock with repair=true when requested', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.reconcileStock).mockResolvedValue(
      createApiSuccess({ ...mockReconciliation(), repairedCount: 3 })
    );

    await store.reconcileStock(true);

    expect(inventoryClient.reconcileStock).toHaveBeenCalledWith(true);
    expect(store.reconciliation?.repairedCount).toBe(3);
  });

  it('defaults repair flag to false', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.reconcileStock).mockResolvedValue(
      createApiSuccess(mockReconciliation())
    );

    await store.reconcileStock();

    expect(inventoryClient.reconcileStock).toHaveBeenCalledWith(false);
  });

  it('sets error on failure', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.reconcileStock).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Reconciliation failed')
    );

    await store.reconcileStock();

    expect(store.error).toBe('Reconciliation failed');
    expect(store.reconciliation).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('sets loading true during reconciliation', async () => {
    const { inventoryClient } = await import('@/api/endpoints/inventory');
    vi.mocked(inventoryClient.reconcileStock).mockResolvedValue(
      createApiSuccess(mockReconciliation())
    );

    const promise = store.reconcileStock();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });
});
