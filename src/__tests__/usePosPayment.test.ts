/**
 * Tests for apps/ui/src/composables/usePosPayment.ts
 *
 * Covers:
 * - processPayment returns {ok:false} for empty cart
 * - processPayment returns {ok:false} when payableTotal <= 0
 * - processPayment returns {ok:false} when paidAmount < payableTotal
 * - processPayment returns {ok:false} when already processing (re-entrancy guard)
 * - processPayment returns {ok:true, saleId} on successful sale
 * - processPayment sets isProcessingPayment true during, false after
 * - processPayment handles sale API failure gracefully
 * - triggerAfterPay fires posClient.afterPay (fire-and-forget)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePosPayment } from '@/composables/usePosPayment';
import { useAccountingStore } from '@/stores/accountingStore';
import { createMockSaleItem, createApiSuccess, createApiFailure } from './factories';

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
  productsClient: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    findByBarcode: vi.fn(),
    getUnits: vi.fn(),
  },
  settingsClient: {
    get: vi.fn(),
    set: vi.fn(),
    getCurrency: vi.fn(),
    getCompany: vi.fn(),
    setCompany: vi.fn(),
    getAppVersion: vi.fn(),
    getPrinters: vi.fn(),
    getTyped: vi.fn(),
    setTyped: vi.fn(),
  },
  posClient: {
    afterPay: vi.fn(),
  },
  postingClient: {
    postIndividualEntry: vi.fn(),
    unpostIndividualEntry: vi.fn(),
  },
  accountingClient: {
    getJournalEntries: vi.fn(),
  },
  registerUnauthorizedHandler: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock('@/utils/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('@/utils/idempotency', () => ({
  generateIdempotencyKey: vi.fn(() => 'test-idem-key'),
}));

vi.mock('@/i18n/t', () => ({
  t: (key: string) => key,
  mapErrorToArabic: (_err: any, fallback: string) => fallback,
}));

const defaultPayload = () => ({
  paid: 10000,
  paymentType: 'cash' as const,
});

const defaultCartItem = () => createMockSaleItem({ quantity: 1, unitPrice: 5000, subtotal: 5000 });

describe('usePosPayment — processPayment guards', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns {ok:false} for empty cart', async () => {
    const { processPayment } = usePosPayment();
    const result = await processPayment(defaultPayload(), [], 0, 0, 0, 'IQD', null, null);
    expect(result.ok).toBe(false);
  });

  it('returns {ok:false} when payableTotal is zero (subtotal=0)', async () => {
    const { processPayment } = usePosPayment();
    const result = await processPayment(
      defaultPayload(),
      [defaultCartItem()],
      0, // subtotal = 0
      0,
      0,
      'IQD',
      null,
      null
    );
    expect(result.ok).toBe(false);
  });

  it('returns {ok:false} when paidAmount < payableTotal', async () => {
    const { processPayment } = usePosPayment();
    const result = await processPayment(
      { paid: 1000, paymentType: 'cash' }, // paid < total
      [defaultCartItem()],
      5000, // subtotal
      0,
      0,
      'IQD',
      null,
      null
    );
    expect(result.ok).toBe(false);
  });

  it('returns {ok:false} when already processing (re-entrancy guard)', async () => {
    const { productsClient, salesClient } = await import('@/api');
    vi.mocked(salesClient.create).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                createApiSuccess({ id: 1, invoiceNumber: 'INV-1', subtotal: 5000, total: 5000 })
              ),
            50
          )
        )
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });

    const { processPayment } = usePosPayment();
    const cartItems = [defaultCartItem()];

    // Start first payment (inflight)
    const first = processPayment(defaultPayload(), cartItems, 5000, 0, 0, 'IQD', null, null);
    // Immediately try second payment
    const second = processPayment(defaultPayload(), cartItems, 5000, 0, 0, 'IQD', null, null);

    const secondResult = await second;
    expect(secondResult.ok).toBe(false); // blocked

    await first; // cleanup
  });
});

describe('usePosPayment — processPayment success', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns {ok:true, saleId} on successful sale creation', async () => {
    const { salesClient, productsClient, posClient } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiSuccess({ id: 42, invoiceNumber: 'INV-042', subtotal: 5000, total: 5000 })
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });
    vi.mocked(posClient.afterPay).mockResolvedValue(
      createApiSuccess({ queued: false, printed: false })
    );

    const { processPayment } = usePosPayment();
    const result = await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    expect(result.ok).toBe(true);
    expect(result.saleId).toBe(42);
  });

  it('isProcessingPayment is false after completion', async () => {
    const { salesClient, productsClient, posClient } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiSuccess({ id: 1, invoiceNumber: 'INV-1', subtotal: 5000, total: 5000 })
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });
    vi.mocked(posClient.afterPay).mockResolvedValue(
      createApiSuccess({ queued: false, printed: false })
    );

    const { isProcessingPayment, processPayment } = usePosPayment();

    await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    expect(isProcessingPayment.value).toBe(false);
  });

  it('applies overlay discount over cart discount', async () => {
    const { salesClient, productsClient, posClient } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiSuccess({ id: 1, invoiceNumber: 'INV-1', subtotal: 5000, total: 4500 })
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });
    vi.mocked(posClient.afterPay).mockResolvedValue(
      createApiSuccess({ queued: false, printed: false })
    );

    const { processPayment } = usePosPayment();
    const result = await processPayment(
      { paid: 5000, paymentType: 'cash', discount: 500 }, // overlay discount
      [defaultCartItem()],
      5000, // subtotal
      200, // cart discount (overlay takes precedence)
      0,
      'IQD',
      null,
      null
    );

    expect(result.ok).toBe(true);
    // sale total = 5000 - 500 = 4500
    expect(salesClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ discount: 500, total: 4500 })
    );
  });
});

describe('usePosPayment — processPayment failure', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns {ok:false} on sale API error', async () => {
    const { salesClient, productsClient } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiFailure('INSUFFICIENT_STOCK', 'Not enough stock')
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });

    const { processPayment } = usePosPayment();
    const result = await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    expect(result.ok).toBe(false);
  });

  it('isProcessingPayment resets to false after error', async () => {
    const { salesClient, productsClient } = await import('@/api');
    vi.mocked(salesClient.create).mockRejectedValue(new Error('Network failure'));
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });

    const { isProcessingPayment, processPayment } = usePosPayment();

    await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    expect(isProcessingPayment.value).toBe(false);
  });
});

describe('usePosPayment — auto-posting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('auto-posts journal entry when autoPostOnSale is enabled and journalEntryId is returned', async () => {
    const { salesClient, productsClient, posClient, postingClient, settingsClient } =
      await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiSuccess({
        id: 10,
        invoiceNumber: 'INV-10',
        subtotal: 5000,
        total: 5000,
        journalEntryId: 99,
      })
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });
    vi.mocked(posClient.afterPay).mockResolvedValue(
      createApiSuccess({ queued: false, printed: false })
    );
    vi.mocked(postingClient.postIndividualEntry).mockResolvedValue(createApiSuccess({ ok: true }));
    vi.mocked(settingsClient.getTyped).mockResolvedValue(
      createApiSuccess({ 'accounting.autoPostOnSale': true })
    );

    const { processPayment } = usePosPayment();
    await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    // Wait for fire-and-forget promises
    await vi.waitFor(() => {
      expect(postingClient.postIndividualEntry).toHaveBeenCalledWith(99);
    });
  });

  it('queries journal entries when journalEntryId is not in sale response', async () => {
    const {
      salesClient,
      productsClient,
      posClient,
      postingClient,
      accountingClient,
      settingsClient,
    } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiSuccess({ id: 10, invoiceNumber: 'INV-10', subtotal: 5000, total: 5000 })
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });
    vi.mocked(posClient.afterPay).mockResolvedValue(
      createApiSuccess({ queued: false, printed: false })
    );
    vi.mocked(accountingClient.getJournalEntries).mockResolvedValue(
      createApiSuccess({
        items: [
          {
            id: 77,
            entryNumber: 'JE-1',
            entryDate: '2024-01-01',
            description: 'Sale',
            totalAmount: 5000,
          },
        ],
        total: 1,
      })
    );
    vi.mocked(postingClient.postIndividualEntry).mockResolvedValue(createApiSuccess({ ok: true }));
    vi.mocked(settingsClient.getTyped).mockResolvedValue(
      createApiSuccess({ 'accounting.autoPostOnSale': true })
    );

    const { processPayment } = usePosPayment();
    await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    await vi.waitFor(() => {
      expect(accountingClient.getJournalEntries).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'sale', sourceId: 10, limit: 1 })
      );
      expect(postingClient.postIndividualEntry).toHaveBeenCalledWith(77);
    });
  });

  it('does not auto-post when autoPostOnSale is disabled', async () => {
    const { salesClient, productsClient, posClient, postingClient } = await import('@/api');
    vi.mocked(salesClient.create).mockResolvedValue(
      createApiSuccess({
        id: 10,
        invoiceNumber: 'INV-10',
        subtotal: 5000,
        total: 5000,
        journalEntryId: 99,
      })
    );
    vi.mocked(productsClient.getAll).mockResolvedValue({ ok: true, data: { items: [], total: 0 } });
    vi.mocked(posClient.afterPay).mockResolvedValue(
      createApiSuccess({ queued: false, printed: false })
    );

    // Directly set the store to disable auto-posting
    const accountingStore = useAccountingStore();
    accountingStore.settings.autoPostOnSale = false;
    accountingStore.$patch({ settingsLoaded: true });

    const { processPayment } = usePosPayment();
    await processPayment(
      { paid: 5000, paymentType: 'cash' },
      [defaultCartItem()],
      5000,
      0,
      0,
      'IQD',
      null,
      null
    );

    // Give time for any async calls
    await new Promise((r) => setTimeout(r, 50));
    expect(postingClient.postIndividualEntry).not.toHaveBeenCalled();
  });
});
