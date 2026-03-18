/**
 * Tests for src/stores/departmentsStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchDepartments: success, failure, loading
 * - fetchDepartmentById: success, failure
 * - createDepartment: success, failure
 * - updateDepartment: success, failure
 * - deleteDepartment: success, failure
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDepartmentsStore } from '@/stores/departmentsStore';
import { createApiSuccess, createApiFailure, createPagedResult } from './factories';
import type { Department } from '@/types/domain';

vi.mock('@/api', () => ({
  departmentsClient: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const createMockDepartment = (overrides?: Partial<Department>): Department => ({
  id: 1,
  name: 'تقنية المعلومات',
  description: 'قسم تقنية المعلومات',
  managerId: null,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('departmentsStore — initial state', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with empty items, zero total, no loading, no error', () => {
    const store = useDepartmentsStore();
    expect(store.items).toEqual([]);
    expect(store.total).toBe(0);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});

describe('departmentsStore — fetchDepartments', () => {
  let store: ReturnType<typeof useDepartmentsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDepartmentsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates items and total on success', async () => {
    const { departmentsClient } = await import('@/api');
    const departments = [
      createMockDepartment(),
      createMockDepartment({ id: 2, name: 'المالية' }),
    ];
    vi.mocked(departmentsClient.getAll).mockResolvedValue(createPagedResult(departments, 2));

    await store.fetchDepartments();

    expect(store.items).toHaveLength(2);
    expect(store.total).toBe(2);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('sets error on API failure', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.getAll).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Database offline')
    );

    await store.fetchDepartments();

    expect(store.error).toBe('Database offline');
    expect(store.loading).toBe(false);
  });

  it('clears previous error before fetching', async () => {
    const { departmentsClient } = await import('@/api');
    store.error = 'stale error' as any;
    vi.mocked(departmentsClient.getAll).mockResolvedValue(createPagedResult([]));

    await store.fetchDepartments();

    expect(store.error).toBeNull();
  });
});

describe('departmentsStore — fetchDepartmentById', () => {
  let store: ReturnType<typeof useDepartmentsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDepartmentsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns department data on success', async () => {
    const { departmentsClient } = await import('@/api');
    const dept = createMockDepartment({ id: 5, name: 'التسويق' });
    vi.mocked(departmentsClient.getById).mockResolvedValue(createApiSuccess(dept));

    const result = await store.fetchDepartmentById(5);

    expect(result.ok).toBe(true);
    if (result.ok && result.data) expect(result.data.name).toBe('التسويق');
    expect(store.loading).toBe(false);
  });

  it('sets error on not found', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.getById).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Department not found')
    );

    await store.fetchDepartmentById(999);

    expect(store.error).toBe('Department not found');
  });
});

describe('departmentsStore — createDepartment', () => {
  let store: ReturnType<typeof useDepartmentsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDepartmentsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok result on success', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.create).mockResolvedValue(
      createApiSuccess(createMockDepartment({ id: 10 }))
    );

    const result = await store.createDepartment({ name: 'قسم جديد' });

    expect(result.ok).toBe(true);
    expect(store.error).toBeNull();
  });

  it('sets error on failure', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.create).mockResolvedValue(
      createApiFailure('VALIDATION', 'Name is required')
    );

    await store.createDepartment({ name: '' });

    expect(store.error).toBe('Name is required');
  });
});

describe('departmentsStore — updateDepartment', () => {
  let store: ReturnType<typeof useDepartmentsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDepartmentsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.update).mockResolvedValue(
      createApiSuccess(createMockDepartment({ name: 'محدث' }))
    );

    const result = await store.updateDepartment(1, { name: 'محدث' });

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.update).mockResolvedValue(
      createApiFailure('NOT_FOUND', 'Department not found')
    );

    await store.updateDepartment(999, { name: 'Ghost' });

    expect(store.error).toBe('Department not found');
  });
});

describe('departmentsStore — deleteDepartment', () => {
  let store: ReturnType<typeof useDepartmentsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDepartmentsStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok on success', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.delete).mockResolvedValue(createApiSuccess({ ok: true }));

    const result = await store.deleteDepartment(1);

    expect(result.ok).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('sets error on failure', async () => {
    const { departmentsClient } = await import('@/api');
    vi.mocked(departmentsClient.delete).mockResolvedValue(
      createApiFailure('CONSTRAINT', 'Department has employees')
    );

    await store.deleteDepartment(1);

    expect(store.error).toBe('Department has employees');
  });
});
