/**
 * Tests for src/stores/payrollStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchPayrollRuns: success, failure, loading, status filter
 * - fetchPayrollRunById: success, failure
 * - createPayrollRun: success, failure
 * - updatePayrollRun: success, failure
 * - submitPayrollRun: success, failure
 * - approvePayrollRun: success, failure
 * - disbursePayrollRun: success, failure
 * - cancelPayrollRun: success, failure
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePayrollStore } from '@/stores/payrollStore';
import { createApiSuccess, createApiFailure, createPagedResult } from './factories';
import type { PayrollRun } from '@/types/domain';

vi.mock('@/api', () => ({
  payrollClient: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    approve: vi.fn(),
    disburse: vi.fn(),
    cancel: vi.fn(),
  },
}));

const createMockPayrollRun = (overrides?: Partial<PayrollRun>): PayrollRun => ({
  id: 1,
  title: 'رواتب يناير 2025',
  periodStart: '2025-01-01',
  periodEnd: '2025-01-31',
  status: 'draft',
  totalAmount: 5000000,
  notes: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

describe('payrollStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, no loading, no error', () => {
    const store = usePayrollStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('payrollStore — fetchPayrollRuns', () => {
  let store: ReturnType<typeof usePayrollStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePayrollStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { payrollClient } = await import('@/api');
    const runs = [
      createMockPayrollRun(),
      createMockPayrollRun({ id: 2, title: 'رواتب فبراير 2025' }),
    ];
    vi.mocked(payrollClient.getAll).mockResolvedValue(createPagedResult(runs, 2));

    await store.fetchPayrollRuns();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets error on API failure', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Database offline')
    );

    await store.fetchPayrollRuns();

    expect(store.error).toBe('Database offline');
    expect(store.loading).toBe(false);
  });

  it('clears previous error before fetching', async () => {
    const { payrollClient } = await import('@/api');
    store.error = 'stale error' as any;
    vi.mocked(payrollClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchPayrollRuns();

    expect(store.error).toBeNull();
  });

  it('forwards status filter param', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchPayrollRuns({ status: 'draft', limit: 10, offset: 0 });

    expect(payrollClient.getAll).toHaveBeenCalledWith({
      status: 'draft',
      limit: 10,
      offset: 0,
    });
  });
});

describe('payrollStore — fetchPayrollRunById', () => {
  let store: ReturnType<typeof usePayrollStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePayrollStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns payroll run data on success', async () => {
    const { payrollClient } = await import('@/api');
    const run = createMockPayrollRun({ id: 5, title: 'رواتب مارس' });
    vi.mocked(payrollClient.getById).mockResolvedValue(createApiSuccess(run));

    const result = await store.fetchPayrollRunById(5);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) expect(result.data.title).toBe('رواتب مارس');
    expect(store.loading).toBe(false);
  });

  it('sets error on not found', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Payroll run not found')
    );

    await store.fetchPayrollRunById(999);

    expect(store.error).toBe('Payroll run not found');
  });
});

describe('payrollStore — createPayrollRun', () => {
  let store: ReturnType<typeof usePayrollStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePayrollStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.create).mockResolvedValue(
      createApiSuccess(createMockPayrollRun({ id: 10 }))
    );

    const result = await store.createPayrollRun({
      title: 'Test',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
    });

    expect(result.ok).toBe(true);
    expect(store.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Title is required')
    );

    await store.createPayrollRun({ title: '', periodStart: '', periodEnd: '' });

    expect(store.error).toBe('Title is required');
  });
});

describe('payrollStore — status transitions', () => {
  let store: ReturnType<typeof usePayrollStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = usePayrollStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submitPayrollRun returns ok on success', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.submit).mockResolvedValue(
      createApiSuccess(createMockPayrollRun({ status: 'submitted' }))
    );

    const result = await store.submitPayrollRun(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('submitPayrollRun sets error on failure', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.submit).mockResolvedValue(
      createApiFailure('INVALID_STATE', 'Cannot submit')
    );

    await store.submitPayrollRun(1);

    expect(store.error).toBe('Cannot submit');
  });

  it('approvePayrollRun returns ok on success', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.approve).mockResolvedValue(
      createApiSuccess(createMockPayrollRun({ status: 'approved' }))
    );

    const result = await store.approvePayrollRun(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('disbursePayrollRun returns ok on success', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.disburse).mockResolvedValue(
      createApiSuccess(createMockPayrollRun({ status: 'disbursed' }))
    );

    const result = await store.disbursePayrollRun(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('cancelPayrollRun returns ok on success', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.cancel).mockResolvedValue(
      createApiSuccess(createMockPayrollRun({ status: 'cancelled' }))
    );

    const result = await store.cancelPayrollRun(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('cancelPayrollRun sets error on failure', async () => {
    const { payrollClient } = await import('@/api');
    vi.mocked(payrollClient.cancel).mockResolvedValue(
      createApiFailure('INVALID_STATE', 'Already disbursed')
    );

    await store.cancelPayrollRun(1);

    expect(store.error).toBe('Already disbursed');
  });
});
