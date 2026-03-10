/**
 * Tests for apps/ui/src/stores/customersStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchCustomers: success, failure, loading, search params
 * - fetchCustomerById: success, failure
 * - createCustomer: success, failure
 * - updateCustomer: success, failure
 * - deleteCustomer: success, failure
 * - Error cleared on each new action
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCustomersStore } from '@/stores/customersStore';
import {
  createApiSuccess,
  createApiFailure,
  createPagedResult,
  createMockCustomer,
} from './factories';

vi.mock('@/api', () => ({
  customersClient: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('customersStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, no loading, no error', () => {
    const store = useCustomersStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('customersStore — fetchCustomers', () => {
  let store: ReturnType<typeof useCustomersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCustomersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { customersClient } = await import('@/api');
    const customers = [createMockCustomer(), createMockCustomer({ id: 2, name: 'Customer B' })];
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult(customers, 2));

    await store.fetchCustomers();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true during fetch, false after', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchCustomers();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on API failure', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Database offline')
    );

    await store.fetchCustomers();

    expect(store.error).toBe('Database offline');
    expect(store.loading).toBe(false);
  });

  it('clears previous error before fetching', async () => {
    const { customersClient } = await import('@/api');
    store.error = 'stale error' as any;
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchCustomers();

    expect(store.error).toBeNull();
  });

  it('forwards search/limit/offset params', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchCustomers({ search: 'Ahmed', limit: 10, offset: 20 });

    expect(customersClient.getAll).toHaveBeenCalledWith({ search: 'Ahmed', limit: 10, offset: 20 });
  });

  it('handles empty result', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getAll).mockResolvedValue(createPagedResult([], 0));

    await store.fetchCustomers();

    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
  });
});

describe('customersStore — fetchCustomerById', () => {
  let store: ReturnType<typeof useCustomersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCustomersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns customer data on success', async () => {
    const { customersClient } = await import('@/api');
    const customer = createMockCustomer({ id: 5, name: 'Fatima' });
    vi.mocked(customersClient.getById).mockResolvedValue(createApiSuccess(customer));

    const result = await store.fetchCustomerById(5);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) expect(result.data.name).toBe('Fatima');
    expect(store.loading).toBe(false);
  });

  it('sets error on not found', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Customer not found')
    );

    await store.fetchCustomerById(999);

    expect(store.error).toBe('Customer not found');
    expect(store.loading).toBe(false);
  });
});

describe('customersStore — createCustomer', () => {
  let store: ReturnType<typeof useCustomersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCustomersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.create).mockResolvedValue(
      createApiSuccess(createMockCustomer({ id: 10 }))
    );

    const result = await store.createCustomer({ name: 'New Customer' });

    expect(result.ok).toBe(true);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Name is required')
    );

    await store.createCustomer({ name: '' });

    expect(store.error).toBe('Name is required');
  });
});

describe('customersStore — updateCustomer', () => {
  let store: ReturnType<typeof useCustomersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCustomersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.update).mockResolvedValue(
      createApiSuccess(createMockCustomer({ name: 'Updated' }))
    );

    const result = await store.updateCustomer(1, { name: 'Updated' });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.update).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Customer not found')
    );

    await store.updateCustomer(999, { name: 'Ghost' });

    expect(store.error).toBe('Customer not found');
  });
});

describe('customersStore — deleteCustomer', () => {
  let store: ReturnType<typeof useCustomersStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useCustomersStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.delete).mockResolvedValue(createApiSuccess({ ok: true }));

    const result = await store.deleteCustomer(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error when customer has outstanding debt', async () => {
    const { customersClient } = await import('@/api');
    vi.mocked(customersClient.delete).mockResolvedValue(
      createApiFailure('CONSTRAINT', 'Customer has outstanding debt')
    );

    await store.deleteCustomer(1);

    expect(store.error).toBe('Customer has outstanding debt');
  });
});
