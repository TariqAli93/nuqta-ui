/**
 * Tests for apps/ui/src/stores/salesStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchSales: success, failure, loading, params forwarding
 * - createSale: success, failure
 * - addPayment: success, failure, idempotency key generation
 * - getSale: success, failure
 * - cancelSale: success, failure
 * - refundSale: success, failure
 * - generateReceipt: success (returns HTML), failure (throws)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSalesStore } from '@/stores/salesStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockSale,
  createMockPayment,
} from './factories';

vi.mock('@/api', () => ({
  salesClient: {
    getAll: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    addPayment: vi.fn(),
    cancel: vi.fn(),
    refund: vi.fn(),
    generateReceipt: vi.fn(),
  },
}));

vi.mock('@/utils/idempotency', () => ({
  generateIdempotencyKey: vi.fn(() => 'idem-key-mock'),
}));

describe('salesStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, loading false, no error', () => {
    const store = useSalesStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('salesStore — fetchSales', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { salesClient } = await import('@/api');
    const sales = [createMockSale(), createMockSale({ id: 2, invoiceNumber: 'INV-002' })];
    vi.mocked(salesClient.getAll).mockResolvedValue(createPagedResult(sales, 2));

    await store.fetchSales();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true during fetch', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchSales();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on API failure', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Database unavailable')
    );

    await store.fetchSales();

    expect(store.error).toBe('Database unavailable');
    expect(store.loading).toBe(false);
  });

  it('clears error before each new fetch', async () => {
    const { salesClient } = await import('@/api');
    store.error = 'previous error' as any;
    vi.mocked(salesClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchSales();

    expect(store.error).toBeNull();
  });

  it('forwards filter params to the client', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchSales({ status: 'completed', page: 2 });

    expect(salesClient.getAll).toHaveBeenCalledWith({ status: 'completed', page: 2 });
  });
});

describe('salesStore — createSale', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { salesClient } = await import('@/api');
    const sale = createMockSale({ id: 10 });
    vi.mocked(salesClient.create).mockResolvedValue(createApiSuccess(sale));

    const result = await store.createSale({
      items: [{ productId: 1, quantity: 2, unitPrice: 1500 }],
      paymentType: 'cash',
    });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiFailure('INSUFFICIENT_STOCK', 'Not enough stock')
    );

    const result = await store.createSale({ items: [], paymentType: 'cash' });

    expect(result.ok).toBe(false);
    expect(store.error).toBe('Not enough stock');
    expect(store.loading).toBe(false);
  });
});

describe('salesStore — addPayment', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls salesClient.addPayment with generated idempotency key', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.addPayment).mockResolvedValue(createApiSuccess(createMockSale()));

    const payment = createMockPayment({ idempotencyKey: null });
    await store.addPayment(1, payment);

    expect(salesClient.addPayment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ idempotencyKey: 'idem-key-mock' })
    );
  });

  it('preserves caller-supplied idempotency key', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.addPayment).mockResolvedValue(createApiSuccess(createMockSale()));

    const payment = createMockPayment({ idempotencyKey: 'caller-key' });
    await store.addPayment(1, payment);

    expect(salesClient.addPayment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ idempotencyKey: 'caller-key' })
    );
  });

  it('sets error on payment failure', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.addPayment).mockResolvedValue(
      createApiFailure('PAYMENT_FAILED', 'Payment rejected')
    );

    await store.addPayment(1, createMockPayment());

    expect(store.error).toBe('Payment rejected');
    expect(store.loading).toBe(false);
  });
});

describe('salesStore — getSale', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns sale data on success', async () => {
    const { salesClient } = await import('@/api');
    const sale = createMockSale({ id: 7 });
    vi.mocked(salesClient.getById).mockResolvedValue(createApiSuccess(sale));

    const result = await store.getSale(7);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe(7);
    }
  });

  it('sets error on not found', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Sale not found')
    );

    await store.getSale(9999);
    expect(store.error).toBe('Sale not found');
  });
});

describe('salesStore — cancelSale', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.cancel).mockResolvedValue(
      createApiSuccess(createMockSale({ status: 'cancelled' }))
    );

    const result = await store.cancelSale(1);
    expect(result.ok).toBe(true);
  });

  it('sets error when cancellation fails', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.cancel).mockResolvedValue(
      createApiFailure('ALREADY_CANCELLED', 'Sale is already cancelled')
    );

    await store.cancelSale(1);
    expect(store.error).toBe('Sale is already cancelled');
  });
});

describe('salesStore — refundSale', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.refund).mockResolvedValue(createApiSuccess(createMockSale()));

    const result = await store.refundSale(1);
    expect(result.ok).toBe(true);
  });

  it('sets error on refund failure', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.refund).mockResolvedValue(
      createApiFailure('REFUND_FAILED', 'Refund window has expired')
    );

    await store.refundSale(1);
    expect(store.error).toBe('Refund window has expired');
  });
});

describe('salesStore — generateReceipt', () => {
  let store: ReturnType<typeof useSalesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useSalesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns receipt HTML on success', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.generateReceipt).mockResolvedValue(
      createApiSuccess({ receiptHtml: '<html>receipt</html>' })
    );

    const html = await store.generateReceipt(1);
    expect(html).toBe('<html>receipt</html>');
  });

  it('throws error when receipt generation fails', async () => {
    const { salesClient } = await import('@/api');
    vi.mocked(salesClient.generateReceipt).mockResolvedValue(
      createApiFailure('RECEIPT_ERROR', 'Template not found')
    );

    await expect(store.generateReceipt(1)).rejects.toThrow('Template not found');
  });
});
