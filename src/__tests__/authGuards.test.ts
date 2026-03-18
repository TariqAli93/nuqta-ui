import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';
import { applyAuthGuard } from '@/auth/guards';
import { useAuthStore } from '@/stores/authStore';
import { useFeatureFlagsStore } from '@/stores/featureFlagsStore';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/stores/featureFlagsStore', () => ({
  useFeatureFlagsStore: vi.fn(),
}));

function createAuthStore(overrides: Record<string, unknown> = {}) {
  return {
    setupStatus: {
      isInitialized: true,
      hasUsers: true,
      hasCompanyInfo: true,
      wizardCompleted: true,
    },
    token: 'mock-token',
    user: {
      id: 1,
      username: 'admin',
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
    },
    permissions: [
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
    ],
    isAuthenticated: true,
    checkInitialSetup: vi.fn(),
    ensureAuthenticated: vi.fn().mockResolvedValue(true),
    startSessionCheck: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

function createFeatureFlagsStore(overrides: Record<string, unknown> = {}) {
  return {
    initialized: true,
    loading: false,
    accountingReady: true,
    purchasesEnabled: true,
    ledgersEnabled: true,
    paymentsOnInvoicesEnabled: true,
    hydrate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createRoute(
  meta: Record<string, unknown>,
  fullPath = '/target',
  name = 'Target',
  matched?: Array<{ meta: Record<string, unknown> }>
) {
  return {
    name,
    fullPath,
    meta,
    matched: matched ?? [{ meta }],
  };
}

describe('applyAuthGuard', () => {
  let guard: (to: any) => Promise<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    const router = {
      beforeEach: vi.fn((callback) => {
        guard = callback;
      }),
    } as unknown as Router;

    applyAuthGuard(router);
  });

  it('redirects unauthenticated users to login', async () => {
    const authStore = createAuthStore({
      isAuthenticated: false,
      token: null,
      user: null,
      permissions: [],
    });

    vi.mocked(useAuthStore).mockReturnValue(authStore as any);
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const result = await guard(createRoute({ requiresAuth: true }, '/sales', 'Sales'));

    expect(authStore.logout).toHaveBeenCalledWith('not_authenticated');
    expect(result).toEqual({ name: 'Login', query: { redirect: '/sales' } });
  });

  it('blocks routes when user lacks required permissions', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        permissions: ['products:read'],
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const meta = { requiresAuth: true, permissions: ['accounting:read'] };
    const result = await guard(createRoute(meta, '/accounting/accounts', 'AccountingAccounts'));

    expect(result).toEqual({ name: 'Forbidden' });
  });

  it('blocks cashier access to accounting routes', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        user: {
          id: 3,
          username: 'cashier',
          fullName: 'Cashier User',
          role: 'cashier',
          isActive: true,
        },
        permissions: ['sales:read', 'sales:create', 'customers:read'],
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const meta = {
      requiresAuth: true,
      requiresAccounting: true,
      permissions: ['accounting:read'],
    };

    const result = await guard(
      createRoute(
        meta,
        '/accounting/accounts',
        'AccountingAccounts'
      )
    );

    expect(result).toEqual({ name: 'Forbidden' });
  });

  it('hydrates feature flags and blocks disabled purchasing routes for non-admin', async () => {
    const featureFlagsStore = createFeatureFlagsStore({
      initialized: false,
    });
    featureFlagsStore.hydrate.mockImplementation(async () => {
      featureFlagsStore.initialized = true;
      featureFlagsStore.purchasesEnabled = false;
    });

    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        user: {
          id: 4,
          username: 'manager',
          fullName: 'Manager User',
          role: 'manager',
          isActive: true,
        },
        permissions: [
          'products:read', 'products:create', 'products:update',
          'purchases:read', 'purchases:create',
          'suppliers:read',
        ],
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(featureFlagsStore as any);

    const meta = {
      requiresAuth: true,
      permissions: ['purchases:read'],
      requiresPurchasing: true,
    };

    const result = await guard(
      createRoute(meta, '/purchases', 'Purchases')
    );

    expect(featureFlagsStore.hydrate).toHaveBeenCalledOnce();
    expect(result).toEqual({ name: 'Forbidden' });
  });

  it('allows admin into routes even when feature flags are disabled', async () => {
    vi.mocked(useAuthStore).mockReturnValue(createAuthStore() as any);
    vi.mocked(useFeatureFlagsStore).mockReturnValue(
      createFeatureFlagsStore({
        accountingReady: false,
        purchasesEnabled: false,
      }) as any
    );

    const meta = {
      requiresAuth: true,
      requiresAccounting: true,
      permissions: ['accounting:read'],
    };

    const result = await guard(
      createRoute(
        meta,
        '/accounting/accounts',
        'AccountingAccounts'
      )
    );

    expect(result).toBe(true);
  });

  it('allows managers into inventory routes when permissions and feature flags match', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        user: {
          id: 4,
          username: 'manager',
          fullName: 'Manager User',
          role: 'manager',
          isActive: true,
        },
        permissions: [
          'products:read', 'products:create',
          'inventory:read', 'inventory:adjust',
        ],
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const meta = {
      requiresAuth: true,
      permissions: ['inventory:read'],
      requiresAccounting: true,
    };

    const result = await guard(
      createRoute(meta, '/inventory/overview', 'InventoryOverview')
    );

    expect(result).toBe(true);
  });

  it('collects permissions from nested matched routes', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        permissions: ['inventory:read'],
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const parentMeta = { requiresAuth: true, permissions: ['inventory:read'] };
    const childMeta = { permissions: ['inventory:adjust'] };

    const result = await guard(
      createRoute(
        { requiresAuth: true, permissions: ['inventory:adjust'] },
        '/inventory/adjustments/new',
        'StockAdjustment',
        [{ meta: parentMeta }, { meta: childMeta }]
      )
    );

    expect(result).toEqual({ name: 'Forbidden' });
  });
});
