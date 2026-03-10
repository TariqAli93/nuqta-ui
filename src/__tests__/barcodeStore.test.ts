/**
 * Tests for apps/ui/src/stores/barcodeStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchTemplates: success, failure, loading
 * - createTemplate: success, failure
 * - deleteTemplate: returns boolean (not ApiResult), success, failure
 * - fetchPrintJobs: success, failure, params forwarding
 * - createPrintJob: success, failure
 * - startPrintJobPolling: calls fetchPrintJobs immediately + on interval
 * - stopPrintJobPolling: stops interval, no further calls
 *
 * NOTE: barcodeStore imports from '@/api/endpoints/barcode' (direct path).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBarcodeStore } from '@/stores/barcodeStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockBarcodeTemplate,
  createMockBarcodePrintJob,
} from './factories';

vi.mock('@/api/endpoints/barcode', () => ({
  barcodeClient: {
    getTemplates: vi.fn(),
    createTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    getPrintJobs: vi.fn(),
    createPrintJob: vi.fn(),
  },
}));

describe('barcodeStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty templates, printJobs, loading false, no error', () => {
    const store = useBarcodeStore();
    expect(store.templates).toEqual([]);
    expect(store.printJobs).toEqual([]);
    expect(store.printJobsTotal).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('barcodeStore — fetchTemplates', () => {
  let store: ReturnType<typeof useBarcodeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBarcodeStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets templates on success', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    const templates = [
      createMockBarcodeTemplate(),
      createMockBarcodeTemplate({ id: 2, name: '50x25 Label', isDefault: false }),
    ];
    vi.mocked(barcodeClient.getTemplates).mockResolvedValue(createApiSuccess(templates));

    await store.fetchTemplates();

    expect(store.templates).toHaveLength(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true then false', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getTemplates).mockResolvedValue(createApiSuccess([]));

    const promise = store.fetchTemplates();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getTemplates).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Templates unavailable')
    );

    await store.fetchTemplates();

    expect(store.error).toBe('Templates unavailable');
    expect(store.loading).toBe(false);
  });

  it('clears error before fetching', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    store.error = 'old error' as any;
    vi.mocked(barcodeClient.getTemplates).mockResolvedValue(createApiSuccess([]));

    await store.fetchTemplates();

    expect(store.error).toBeNull();
  });
});

describe('barcodeStore — createTemplate', () => {
  let store: ReturnType<typeof useBarcodeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBarcodeStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.createTemplate).mockResolvedValue(
      createApiSuccess(createMockBarcodeTemplate({ id: 5 }))
    );

    const result = await store.createTemplate({
      name: 'New Template',
      width: 60,
      height: 40,
    });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.createTemplate).mockResolvedValue(
      createApiFailure('VALIDATION', 'Template name already exists')
    );

    await store.createTemplate({ name: 'Duplicate', width: 50, height: 30 });

    expect(store.error).toBe('Template name already exists');
  });
});

describe('barcodeStore — deleteTemplate', () => {
  let store: ReturnType<typeof useBarcodeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBarcodeStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true (boolean) on success — not ApiResult', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.deleteTemplate).mockResolvedValue(createApiSuccess({ ok: true }));

    const result = await store.deleteTemplate(1);

    // deleteTemplate returns result.ok (boolean), not the full ApiResult
    expect(result).toBe(true);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('returns false and sets error on failure', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.deleteTemplate).mockResolvedValue(
      createApiFailure('CONSTRAINT', 'Template is in use by print jobs')
    );

    const result = await store.deleteTemplate(1);

    expect(result).toBe(false);
    expect(store.error).toBe('Template is in use by print jobs');
  });
});

describe('barcodeStore — fetchPrintJobs', () => {
  let store: ReturnType<typeof useBarcodeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBarcodeStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets printJobs and printJobsTotal on success', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    const jobs = [
      createMockBarcodePrintJob(),
      createMockBarcodePrintJob({ id: 2, status: 'printed' }),
    ];
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult(jobs, 2));

    await store.fetchPrintJobs();

    expect(store.printJobs).toHaveLength(2);
    expect(store.printJobsTotal).toBe(2);
    expect(store.loading).toBe(false);
  });

  it('sets loading true then false', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchPrintJobs();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Print jobs unavailable')
    );

    await store.fetchPrintJobs();

    expect(store.error).toBe('Print jobs unavailable');
  });

  it('forwards status/productId filter params', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult([]));

    await store.fetchPrintJobs({ productId: 3, status: 'pending', limit: 10 });

    expect(barcodeClient.getPrintJobs).toHaveBeenCalledWith({
      productId: 3,
      status: 'pending',
      limit: 10,
    });
  });
});

describe('barcodeStore — createPrintJob', () => {
  let store: ReturnType<typeof useBarcodeStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBarcodeStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.createPrintJob).mockResolvedValue(
      createApiSuccess(createMockBarcodePrintJob({ id: 10 }))
    );

    const result = await store.createPrintJob({
      templateId: 1,
      productId: 1,
      productName: 'Widget',
      quantity: 5,
    });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.createPrintJob).mockResolvedValue(
      createApiFailure('VALIDATION', 'Quantity must be positive')
    );

    await store.createPrintJob({
      templateId: 1,
      productId: 1,
      productName: 'Widget',
      quantity: 0,
    });

    expect(store.error).toBe('Quantity must be positive');
  });
});

describe('barcodeStore — polling', () => {
  let store: ReturnType<typeof useBarcodeStore>;

  beforeEach(() => {
    vi.clearAllMocks(); // reset call counts accumulated from earlier describes
    setActivePinia(createPinia());
    store = useBarcodeStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    store.stopPrintJobPolling();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('startPrintJobPolling calls fetchPrintJobs immediately', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult([]));

    store.startPrintJobPolling(undefined, 3000);
    await Promise.resolve(); // flush immediate call

    expect(barcodeClient.getPrintJobs).toHaveBeenCalledTimes(1);
  });

  it('startPrintJobPolling triggers fetchPrintJobs on each interval tick', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult([]));

    store.startPrintJobPolling(undefined, 1000);
    await Promise.resolve(); // initial call

    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    // 1 immediate + 2 interval ticks
    expect(barcodeClient.getPrintJobs).toHaveBeenCalledTimes(3);
  });

  it('stopPrintJobPolling prevents further interval calls', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult([]));

    store.startPrintJobPolling(undefined, 1000);
    await Promise.resolve(); // initial call
    store.stopPrintJobPolling();

    vi.advanceTimersByTime(3000);
    await Promise.resolve();

    // Only the initial immediate call — no interval calls
    expect(barcodeClient.getPrintJobs).toHaveBeenCalledTimes(1);
  });

  it('startPrintJobPolling stops existing poll before starting a new one', async () => {
    const { barcodeClient } = await import('@/api/endpoints/barcode');
    vi.mocked(barcodeClient.getPrintJobs).mockResolvedValue(createPagedResult([]));

    store.startPrintJobPolling(undefined, 1000);
    await Promise.resolve();

    // Restart — should not double-poll
    store.startPrintJobPolling(undefined, 1000);
    await Promise.resolve();

    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    // 2 immediate calls (one per start) + 1 interval from the second poll only
    expect(barcodeClient.getPrintJobs).toHaveBeenCalledTimes(3);
  });
});
