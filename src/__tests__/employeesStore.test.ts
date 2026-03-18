/**
 * Tests for src/stores/employeesStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchEmployees: success, failure, loading, search params
 * - fetchEmployeeById: success, failure
 * - createEmployee: success, failure
 * - updateEmployee: success, failure
 * - deleteEmployee: success, failure
 * - Error cleared on each new action
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useEmployeesStore } from '@/stores/employeesStore';
import { createApiSuccess, createApiFailure, createPagedResult } from './factories';
import type { Employee } from '@/types/domain';

vi.mock('@/api', () => ({
  employeesClient: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const createMockEmployee = (overrides?: Partial<Employee>): Employee => ({
  id: 1,
  fullName: 'أحمد محمد',
  phone: '07700000000',
  email: 'ahmed@example.com',
  departmentId: 1,
  designation: 'مطور',
  dateOfJoining: '2024-01-01',
  dateOfBirth: '1990-05-15',
  salary: 1500000,
  status: 'active',
  address: 'بغداد',
  notes: null,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('employeesStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, no loading, no error', () => {
    const store = useEmployeesStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('employeesStore — fetchEmployees', () => {
  let store: ReturnType<typeof useEmployeesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useEmployeesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { employeesClient } = await import('@/api');
    const employees = [createMockEmployee(), createMockEmployee({ id: 2, fullName: 'سارة علي' })];
    vi.mocked(employeesClient.getAll).mockResolvedValue(createPagedResult(employees, 2));

    await store.fetchEmployees();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets loading true during fetch, false after', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.getAll).mockResolvedValue(createPagedResult([]));

    const promise = store.fetchEmployees();
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('sets error on API failure', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Database offline')
    );

    await store.fetchEmployees();

    expect(store.error).toBe('Database offline');
    expect(store.loading).toBe(false);
  });

  it('clears previous error before fetching', async () => {
    const { employeesClient } = await import('@/api');
    store.error = 'stale error' as any;
    vi.mocked(employeesClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchEmployees();

    expect(store.error).toBeNull();
  });

  it('forwards search/limit/offset params', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchEmployees({ search: 'Ahmed', limit: 10, offset: 20 });

    expect(employeesClient.getAll).toHaveBeenCalledWith({
      search: 'Ahmed',
      limit: 10,
      offset: 20,
    });
  });
});

describe('employeesStore — fetchEmployeeById', () => {
  let store: ReturnType<typeof useEmployeesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useEmployeesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns employee data on success', async () => {
    const { employeesClient } = await import('@/api');
    const employee = createMockEmployee({ id: 5, fullName: 'فاطمة' });
    vi.mocked(employeesClient.getById).mockResolvedValue(createApiSuccess(employee));

    const result = await store.fetchEmployeeById(5);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) expect(result.data.fullName).toBe('فاطمة');
    expect(store.loading).toBe(false);
  });

  it('sets error on not found', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Employee not found')
    );

    await store.fetchEmployeeById(999);

    expect(store.error).toBe('Employee not found');
    expect(store.loading).toBe(false);
  });
});

describe('employeesStore — createEmployee', () => {
  let store: ReturnType<typeof useEmployeesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useEmployeesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.create).mockResolvedValue(
      createApiSuccess(createMockEmployee({ id: 10 }))
    );

    const result = await store.createEmployee({ fullName: 'New Employee' });

    expect(result.ok).toBe(true);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Name is required')
    );

    await store.createEmployee({ fullName: '' });

    expect(store.error).toBe('Name is required');
  });
});

describe('employeesStore — updateEmployee', () => {
  let store: ReturnType<typeof useEmployeesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useEmployeesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.update).mockResolvedValue(
      createApiSuccess(createMockEmployee({ fullName: 'Updated' }))
    );

    const result = await store.updateEmployee(1, { fullName: 'Updated' });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.update).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Employee not found')
    );

    await store.updateEmployee(999, { fullName: 'Ghost' });

    expect(store.error).toBe('Employee not found');
  });
});

describe('employeesStore — deleteEmployee', () => {
  let store: ReturnType<typeof useEmployeesStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useEmployeesStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.delete).mockResolvedValue(createApiSuccess({ ok: true }));

    const result = await store.deleteEmployee(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { employeesClient } = await import('@/api');
    vi.mocked(employeesClient.delete).mockResolvedValue(
      createApiFailure('CONSTRAINT', 'Cannot delete employee with payroll records')
    );

    await store.deleteEmployee(1);

    expect(store.error).toBe('Cannot delete employee with payroll records');
  });
});
