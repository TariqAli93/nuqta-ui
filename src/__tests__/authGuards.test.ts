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

function createRoute(meta: Record<string, unknown>, fullPath = '/target', name = 'Target') {
  return {
    name,
    fullPath,
    meta,
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
    });

    vi.mocked(useAuthStore).mockReturnValue(authStore as any);
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const result = await guard(createRoute({ requiresAuth: true }, '/sales', 'Sales'));

    expect(authStore.logout).toHaveBeenCalledWith('not_authenticated');
    expect(result).toEqual({ name: 'Login', query: { redirect: '/sales' } });
  });

  it('blocks routes that require an exact role', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        user: {
          id: 2,
          username: 'manager',
          fullName: 'Manager User',
          role: 'manager',
          isActive: true,
        },
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const result = await guard(createRoute({ requiresAuth: true, requiresRole: 'admin' }));

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
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const result = await guard(
      createRoute(
        {
          requiresAuth: true,
          requiresViewAccounting: true,
          requiresAccounting: true,
        },
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
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(featureFlagsStore as any);

    const result = await guard(
      createRoute(
        {
          requiresAuth: true,
          requiresManagePurchases: true,
          requiresPurchasing: true,
        },
        '/purchases',
        'Purchases'
      )
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

    const result = await guard(
      createRoute(
        {
          requiresAuth: true,
          requiresViewAccounting: true,
          requiresAccounting: true,
        },
        '/accounting/accounts',
        'AccountingAccounts'
      )
    );

    expect(result).toBe(true);
  });

  it('allows managers into inventory routes when role and feature flags match', async () => {
    vi.mocked(useAuthStore).mockReturnValue(
      createAuthStore({
        user: {
          id: 4,
          username: 'manager',
          fullName: 'Manager User',
          role: 'manager',
          isActive: true,
        },
      }) as any
    );
    vi.mocked(useFeatureFlagsStore).mockReturnValue(createFeatureFlagsStore() as any);

    const result = await guard(
      createRoute(
        {
          requiresAuth: true,
          requiresViewInventory: true,
          requiresAccounting: true,
        },
        '/inventory/overview',
        'InventoryOverview'
      )
    );

    expect(result).toBe(true);
  });
});
