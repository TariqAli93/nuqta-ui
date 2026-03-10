/**
 * Tests for apps/ui/src/stores/suppliersStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchSuppliers: success, failure, loading, params
 * - fetchSupplierById: success, failure
 * - createSupplier: success, failure
 * - updateSupplier: success, failure
 * - deleteSupplier: success, failure
 *
 * NOTE: suppliersStore imports directly from '@/api/endpoints/suppliers',
 * so vi.mock targets that path (not the barrel '@/api').
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSuppliersStore } from '@/stores/suppliersStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockSupplier,
} from './factories';

vi.mock('@/api/endpoints/suppliers', () => ({
  suppliersClient: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('suppliersStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, no loading, no error', () => {
    const store = useSuppliersStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('suppliersStore — fetchSuppliers', () => {
  let store: ReturnType<typeof useSuppliersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSuppliersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    const suppliers = [createMockSupplier(), createMockSupplier({ id: 2, name: 'Supplier B' })];
    vi.mocked(suppliersClient.getAll).mockResolvedValue(createPagedResult(suppliers, 2));

    await store.fetchSuppliers();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('sets loading true during fetch', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchSuppliers();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Failed to fetch suppliers')
    );

    await store.fetchSuppliers();

    expect(store.error).toBe('Failed to fetch suppliers');
    expect(store.loading).toBe(false);
  });

  it('clears previous error before new fetch', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    store.error = 'old error' as any;
    vi.mocked(suppliersClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchSuppliers();

    expect(store.error).toBeNull();
  });

  it('forwards search params to the client', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchSuppliers({ search: 'Al-Rashid', limit: 5, offset: 0 });

    expect(suppliersClient.getAll).toHaveBeenCalledWith({
      search: 'Al-Rashid',
      limit: 5,
      offset: 0,
    });
  });
});

describe('suppliersStore — fetchSupplierById', () => {
  let store: ReturnType<typeof useSuppliersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSuppliersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns supplier on success', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    const supplier = createMockSupplier({ id: 3, name: 'Al-Rashid Trading' });
    vi.mocked(suppliersClient.getById).mockResolvedValue(createApiSuccess(supplier));

    const result = await store.fetchSupplierById(3);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) expect(result.data.name).toBe('Al-Rashid Trading');
    expect(store.loading).toBe(false);
  });

  it('sets error on not found', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Supplier not found')
    );

    await store.fetchSupplierById(999);

    expect(store.error).toBe('Supplier not found');
  });
});

describe('suppliersStore — createSupplier', () => {
  let store: ReturnType<typeof useSuppliersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSuppliersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.create).mockResolvedValue(
      createApiSuccess(createMockSupplier({ id: 20 }))
    );

    const result = await store.createSupplier({ name: 'New Supplier' });

    expect(result.ok).toBe(true);
    expect(store.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Supplier name already exists')
    );

    await store.createSupplier({ name: 'Duplicate' });

    expect(store.error).toBe('Supplier name already exists');
  });
});

describe('suppliersStore — updateSupplier', () => {
  let store: ReturnType<typeof useSuppliersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSuppliersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.update).mockResolvedValue(
      createApiSuccess(createMockSupplier({ name: 'Renamed' }))
    );

    const result = await store.updateSupplier(1, { name: 'Renamed' });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.update).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Supplier not found')
    );

    await store.updateSupplier(999, { name: 'Ghost' });

    expect(store.error).toBe('Supplier not found');
  });
});

describe('suppliersStore — deleteSupplier', () => {
  let store: ReturnType<typeof useSuppliersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSuppliersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.delete).mockResolvedValue(createApiSuccess({ ok: true }));

    const result = await store.deleteSupplier(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error when supplier has linked purchases', async () => {
    const { suppliersClient } = await import('@/api/endpoints/suppliers');
    vi.mocked(suppliersClient.delete).mockResolvedValue(
      createApiFailure('CONSTRAINT', 'Supplier has linked purchase records')
    );

    await store.deleteSupplier(1);

    expect(store.error).toBe('Supplier has linked purchase records');
  });
});
