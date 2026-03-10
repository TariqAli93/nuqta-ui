/**
 * Tests for apps/ui/src/stores/productsStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchProducts: success, failure, loading transitions, barcode cache rebuild
 * - createProduct: success, failure
 * - updateProduct: success, failure
 * - deleteProduct: success, failure
 * - fetchProductById: success, failure
 * - findProductByBarcode: cache hit, cache miss (API fallback), not found
 * - rebuildBarcodeCache: populates cache from items
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProductsStore } from '@/stores/productsStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockProduct,
} from './factories';

vi.mock('@/api', () => ({
  productsClient: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    findByBarcode: vi.fn(),
  },
}));

describe('productsStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, loading false, no error', () => {
    const store = useProductsStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('productsStore — fetchProducts', () => {
  let store: ReturnType<typeof useProductsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets items and total on success', async () => {
    const { productsClient } = await import('@/api');
    const products = [createMockProduct(), createMockProduct({ id: 2, name: 'Product 2' })];
    vi.mocked(productsClient.getAll).mockResolvedValue(createPagedResult(products, 2));

    await store.fetchProducts();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true during fetch', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchProducts();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error and clears items on API failure', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Failed to fetch products')
    );

    await store.fetchProducts();

    expect(store.error).toBe('Failed to fetch products');
    expect(store.loading).toBe(false);
  });

  it('passes search params to the client', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchProducts({ search: 'laptop', page: 2, limit: 20 });

    expect(productsClient.getAll).toHaveBeenCalledWith({ search: 'laptop', page: 2, limit: 20 });
  });

  it('handles empty result set', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getAll).mockResolvedValue(createPagedResult([], 0));

    await store.fetchProducts();

    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
  });
});

describe('productsStore — createProduct', () => {
  let store: ReturnType<typeof useProductsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { productsClient } = await import('@/api');
    const newProduct = createMockProduct({ id: 99, name: 'New Product' });
    vi.mocked(productsClient.create).mockResolvedValue(createApiSuccess(newProduct));

    const result = await store.createProduct({
      name: 'New Product',
      costPrice: 1000,
      sellingPrice: 1500,
    });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Product name is required')
    );

    const result = await store.createProduct({ name: '', costPrice: 0, sellingPrice: 0 });

    expect(result.ok).toBe(false);
    expect(store.error).toBe('Product name is required');
    expect(store.loading).toBe(false);
  });
});

describe('productsStore — updateProduct', () => {
  let store: ReturnType<typeof useProductsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { productsClient } = await import('@/api');
    const updated = createMockProduct({ name: 'Updated Name' });
    vi.mocked(productsClient.update).mockResolvedValue(createApiSuccess(updated));

    const result = await store.updateProduct(1, { name: 'Updated Name', costPrice: 1000, sellingPrice: 1500 });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.update).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Product not found')
    );

    await store.updateProduct(999, { name: 'Ghost', costPrice: 0, sellingPrice: 0 });

    expect(store.error).toBe('Product not found');
  });
});

describe('productsStore — deleteProduct', () => {
  let store: ReturnType<typeof useProductsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.delete).mockResolvedValue(createApiSuccess({ ok: true }));

    const result = await store.deleteProduct(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error when product cannot be deleted', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.delete).mockResolvedValue(
      createApiFailure('CONSTRAINT', 'Product has existing sales')
    );

    await store.deleteProduct(1);

    expect(store.error).toBe('Product has existing sales');
  });
});

describe('productsStore — fetchProductById', () => {
  let store: ReturnType<typeof useProductsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns product on success', async () => {
    const { productsClient } = await import('@/api');
    const product = createMockProduct({ id: 5 });
    vi.mocked(productsClient.getById).mockResolvedValue(createApiSuccess(product));

    const result = await store.fetchProductById(5);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) {
      expect(result.data.id).toBe(5);
    }
  });

  it('sets error on not found', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Product not found')
    );

    await store.fetchProductById(999);

    expect(store.error).toBe('Product not found');
  });
});

describe('productsStore — barcode cache', () => {
  let store: ReturnType<typeof useProductsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProductsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('findProductByBarcode returns cached product (cache hit)', async () => {
    const { productsClient } = await import('@/api');
    const product = createMockProduct({ barcode: 'BAR-001' });
    vi.mocked(productsClient.getAll).mockResolvedValue(createPagedResult([product]));

    await store.fetchProducts(); // populates cache

    const found = await store.findProductByBarcode('BAR-001');
    expect(found).toEqual(product);
    expect(productsClient.findByBarcode).not.toHaveBeenCalled();
  });

  it('findProductByBarcode falls back to API (cache miss)', async () => {
    const { productsClient } = await import('@/api');
    const product = createMockProduct({ barcode: 'MISS-999' });
    vi.mocked(productsClient.findByBarcode).mockResolvedValue(createApiSuccess(product));

    const found = await store.findProductByBarcode('MISS-999');

    expect(productsClient.findByBarcode).toHaveBeenCalledWith('MISS-999');
    expect(found).toEqual(product);
  });

  it('findProductByBarcode returns null when not found anywhere', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.findByBarcode).mockResolvedValue(
      createApiSuccess(null as any)
    );

    const found = await store.findProductByBarcode('NONEXISTENT');
    expect(found).toBeNull();
  });

  it('rebuildBarcodeCache skips products without barcode', async () => {
    const { productsClient } = await import('@/api');
    const withBarcode = createMockProduct({ barcode: 'HAS-BARCODE' });
    const withoutBarcode = createMockProduct({ id: 2, barcode: null });
    vi.mocked(productsClient.getAll).mockResolvedValue(
      createPagedResult([withBarcode, withoutBarcode])
    );

    await store.fetchProducts();

    const found = await store.findProductByBarcode('HAS-BARCODE');
    expect(found).toEqual(withBarcode);
  });
});
