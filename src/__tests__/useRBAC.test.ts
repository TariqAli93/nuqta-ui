/**
 * Tests for src/composables/useRBAC.ts
 *
 * Covers:
 * - can() returns false when permissions array is empty
 * - can() returns true for matching permissions
 * - canAny() OR logic
 * - canAll() AND logic
 * - Reactivity: permissions update → can() reflects change
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useRBAC } from '@/composables/useRBAC';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/api', () => ({
  authClient: {
    login: vi.fn(),
    checkInitialSetup: vi.fn(),
    createFirstUser: vi.fn(),
    initializeApp: vi.fn(),
    getCurrentUser: vi.fn(),
    validateToken: vi.fn(),
    logout: vi.fn(),
  },
  registerUnauthorizedHandler: vi.fn(),
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock('@/utils/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('@/i18n/t', () => ({
  t: (key: string) => key,
}));

describe('useRBAC — no permissions (unauthenticated)', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('can() returns false for any permission when permissions are empty', () => {
    const { can } = useRBAC();
    expect(can('products:create')).toBe(false);
    expect(can('sales:create')).toBe(false);
    expect(can('settings:update')).toBe(false);
  });

  it('canAny() returns false when permissions are empty', () => {
    const { canAny } = useRBAC();
    expect(canAny('products:create', 'sales:create')).toBe(false);
  });

  it('canAll() returns false when permissions are empty', () => {
    const { canAll } = useRBAC();
    expect(canAll('products:create', 'sales:create')).toBe(false);
  });
});

describe('useRBAC — with permissions', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('can() returns true for granted permissions', () => {
    const authStore = useAuthStore();
    authStore.permissions = ['products:create', 'products:read', 'sales:create'];

    const { can } = useRBAC();
    expect(can('products:create')).toBe(true);
    expect(can('products:read')).toBe(true);
    expect(can('sales:create')).toBe(true);
  });

  it('can() returns false for non-granted permissions', () => {
    const authStore = useAuthStore();
    authStore.permissions = ['products:create'];

    const { can } = useRBAC();
    expect(can('settings:update')).toBe(false);
    expect(can('accounting:read')).toBe(false);
  });

  it('canAny() returns true if at least one permission matches', () => {
    const authStore = useAuthStore();
    authStore.permissions = ['products:create'];

    const { canAny } = useRBAC();
    expect(canAny('products:create', 'settings:update')).toBe(true);
  });

  it('canAny() returns false if none match', () => {
    const authStore = useAuthStore();
    authStore.permissions = ['products:create'];

    const { canAny } = useRBAC();
    expect(canAny('settings:update', 'accounting:read')).toBe(false);
  });

  it('canAll() returns true when all permissions match', () => {
    const authStore = useAuthStore();
    authStore.permissions = ['products:create', 'products:read', 'sales:create'];

    const { canAll } = useRBAC();
    expect(canAll('products:create', 'products:read')).toBe(true);
  });

  it('canAll() returns false when some permissions are missing', () => {
    const authStore = useAuthStore();
    authStore.permissions = ['products:create'];

    const { canAll } = useRBAC();
    expect(canAll('products:create', 'settings:update')).toBe(false);
  });
});

describe('useRBAC — admin-like full permissions', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('user with all permissions has full access', () => {
    const authStore = useAuthStore();
    authStore.permissions = [
      'sales:read', 'sales:create', 'sales:refund', 'sales:cancel',
      'products:read', 'products:create', 'products:update', 'products:delete',
      'customers:read', 'customers:create', 'customers:update',
      'suppliers:read', 'suppliers:create', 'suppliers:update',
      'purchases:read', 'purchases:create',
      'inventory:read', 'inventory:adjust',
      'hr:read', 'hr:update',
      'payroll:read', 'payroll:update', 'payroll:approve',
      'accounting:read', 'accounting:update',
      'settings:read', 'settings:update',
      'users:read', 'users:create', 'users:update',
      'barcodes:print', 'backup:read',
    ];

    const { can } = useRBAC();
    expect(can('products:create')).toBe(true);
    expect(can('settings:update')).toBe(true);
    expect(can('accounting:read')).toBe(true);
    expect(can('payroll:approve')).toBe(true);
    expect(can('backup:read')).toBe(true);
  });
});

describe('useRBAC — reactivity on permissions change', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('can() reflects permission changes', () => {
    const authStore = useAuthStore();
    authStore.permissions = [];

    const { can } = useRBAC();
    expect(can('products:create')).toBe(false);

    // Grant permission
    authStore.permissions = ['products:create'];
    expect(can('products:create')).toBe(true);

    // Revoke permission
    authStore.permissions = [];
    expect(can('products:create')).toBe(false);
  });
});
