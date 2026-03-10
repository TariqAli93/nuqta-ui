/**
 * Tests for apps/ui/src/stores/purchasesStore.ts
 *
 * Covers:
 * - Initial state (items, total, currentPurchase, loading, error)
 * - fetchPurchases: success, failure, loading, params
 * - fetchPurchaseById: success (sets currentPurchase), failure
 * - createPurchase: success, failure
 *
 * NOTE: purchasesStore imports directly from '@/api/endpoints/purchases'.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePurchasesStore } from '@/stores/purchasesStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockPurchase,
} from './factories';

vi.mock('@/api/endpoints/purchases', () => ({
  purchasesClient: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

describe('purchasesStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts empty with null currentPurchase', () => {
    const store = usePurchasesStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.currentPurchase).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('purchasesStore — fetchPurchases', () => {
  let store: ReturnType<typeof usePurchasesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePurchasesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    const purchases = [
      createMockPurchase(),
      createMockPurchase({ id: 2, invoiceNumber: 'PUR-002' }),
    ];
    vi.mocked(purchasesClient.getAll).mockResolvedValue(createPagedResult(purchases, 2));

    await store.fetchPurchases();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true then false on success', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchPurchases();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Purchases unavailable')
    );

    await store.fetchPurchases();

    expect(store.error).toBe('Purchases unavailable');
    expect(store.loading).toBe(false);
  });

  it('clears error before new fetch', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    store.error = 'old error' as any;
    vi.mocked(purchasesClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchPurchases();

    expect(store.error).toBeNull();
  });

  it('forwards filter params to client', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchPurchases({ supplierId: 3, status: 'completed', limit: 50 });

    expect(purchasesClient.getAll).toHaveBeenCalledWith({
      supplierId: 3,
      status: 'completed',
      limit: 50,
    });
  });
});

describe('purchasesStore — fetchPurchaseById', () => {
  let store: ReturnType<typeof usePurchasesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePurchasesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets currentPurchase on success', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    const purchase = createMockPurchase({ id: 7, invoiceNumber: 'PUR-007' });
    vi.mocked(purchasesClient.getById).mockResolvedValue(createApiSuccess(purchase));

    const result = await store.fetchPurchaseById(7);

    expect(result.ok).toBe(true);
    expect(store.currentPurchase).toEqual(purchase);
    expect(store.loading).toBe(false);
  });

  it('sets loading during fetch', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.getById).mockResolvedValue(createApiSuccess(createMockPurchase()));

    const promise = store.fetchPurchaseById(1);
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('does not overwrite currentPurchase on failure', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    const existing = createMockPurchase({ id: 1 });
    store.currentPurchase = existing;

    vi.mocked(purchasesClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Purchase not found')
    );

    await store.fetchPurchaseById(999);

    expect(store.currentPurchase).toEqual(existing); // unchanged
    expect(store.error).toBe('Purchase not found');
  });
});

describe('purchasesStore — createPurchase', () => {
  let store: ReturnType<typeof usePurchasesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePurchasesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.create).mockResolvedValue(
      createApiSuccess(createMockPurchase({ id: 99 }))
    );

    const result = await store.createPurchase({
      invoiceNumber: 'PUR-099',
      supplierId: 1,
      items: [
        {
          productId: 1,
          unitName: 'piece',
          unitFactor: 1,
          quantity: 10,
          unitCost: 1000,
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('sets error on validation failure', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Items array cannot be empty')
    );

    await store.createPurchase({
      invoiceNumber: 'PUR-BAD',
      supplierId: 1,
      items: [],
    });

    expect(store.error).toBe('Items array cannot be empty');
    expect(store.loading).toBe(false);
  });

  it('sets loading true then false on success', async () => {
    const { purchasesClient } = await import('@/api/endpoints/purchases');
    vi.mocked(purchasesClient.create).mockResolvedValue(
      createApiSuccess(createMockPurchase())
    );

    const promise = store.createPurchase({
      invoiceNumber: 'PUR-X',
      supplierId: 1,
      items: [{ productId: 1, unitName: 'piece', unitFactor: 1, quantity: 1, unitCost: 100 }],
    });
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });
});
