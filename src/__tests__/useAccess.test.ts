/**
 * Tests for apps/ui/src/composables/useAccess.ts
 *
 * Covers:
 * - Each permission computed when authStore.user is null → false
 * - admin role → all permissions true
 * - manager role → product/customer/sales/purchases/suppliers/inventory/stock/barcodes true,
 *                  settings/users/accounting false
 * - cashier role → only createSales and manageCustomers true
 * - viewer role → all permissions false
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAccess } from '@/composables/useAccess';
import { useAuthStore } from '@/stores/authStore';
import { createMockUserPublic } from './factories';

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

function setUserRole(authStore: ReturnType<typeof useAuthStore>, role: string) {
  authStore.user = createMockUserPublic({ role: role as any }) as any;
}

describe('useAccess — no user (unauthenticated)', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('all permissions are false when user is null', () => {
    const access = useAccess();
    expect(access.canManageProducts.value).toBe(false);
    expect(access.canManageCustomers.value).toBe(false);
    expect(access.canCreateSales.value).toBe(false);
    expect(access.canManageSettings.value).toBe(false);
    expect(access.canManageUsers.value).toBe(false);
    expect(access.canManagePurchases.value).toBe(false);
    expect(access.canManageSuppliers.value).toBe(false);
    expect(access.canViewInventory.value).toBe(false);
    expect(access.canViewAccounting.value).toBe(false);
    expect(access.canAdjustStock.value).toBe(false);
    expect(access.canPrintBarcodes.value).toBe(false);
  });
});

describe('useAccess — admin role', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('admin has all permissions', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'admin');

    const access = useAccess();

    expect(access.canManageProducts.value).toBe(true);
    expect(access.canManageCustomers.value).toBe(true);
    expect(access.canCreateSales.value).toBe(true);
    expect(access.canManageSettings.value).toBe(true);
    expect(access.canManageUsers.value).toBe(true);
    expect(access.canManagePurchases.value).toBe(true);
    expect(access.canManageSuppliers.value).toBe(true);
    expect(access.canViewInventory.value).toBe(true);
    expect(access.canViewAccounting.value).toBe(true);
    expect(access.canAdjustStock.value).toBe(true);
    expect(access.canPrintBarcodes.value).toBe(true);
  });
});

describe('useAccess — manager role', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('manager has product/customer/sales/purchases/suppliers/inventory/stock/barcode access', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'manager');

    const access = useAccess();

    expect(access.canManageProducts.value).toBe(true);
    expect(access.canManageCustomers.value).toBe(true);
    expect(access.canCreateSales.value).toBe(true);
    expect(access.canManagePurchases.value).toBe(true);
    expect(access.canManageSuppliers.value).toBe(true);
    expect(access.canViewInventory.value).toBe(true);
    expect(access.canAdjustStock.value).toBe(true);
    expect(access.canPrintBarcodes.value).toBe(true);
  });

  it('manager cannot manage settings, users, or view accounting', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'manager');

    const access = useAccess();

    expect(access.canManageSettings.value).toBe(false);
    expect(access.canManageUsers.value).toBe(false);
    expect(access.canViewAccounting.value).toBe(false);
  });
});

describe('useAccess — cashier role', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('cashier can create sales and manage customers', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'cashier');

    const access = useAccess();

    expect(access.canCreateSales.value).toBe(true);
    expect(access.canManageCustomers.value).toBe(true);
  });

  it('cashier cannot manage products, settings, users, purchases, suppliers, inventory, accounting', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'cashier');

    const access = useAccess();

    expect(access.canManageProducts.value).toBe(false);
    expect(access.canManageSettings.value).toBe(false);
    expect(access.canManageUsers.value).toBe(false);
    expect(access.canManagePurchases.value).toBe(false);
    expect(access.canManageSuppliers.value).toBe(false);
    expect(access.canViewInventory.value).toBe(false);
    expect(access.canViewAccounting.value).toBe(false);
    expect(access.canAdjustStock.value).toBe(false);
    expect(access.canPrintBarcodes.value).toBe(false);
  });
});

describe('useAccess — viewer role', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('viewer has no permissions at all', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'viewer');

    const access = useAccess();

    expect(access.canManageProducts.value).toBe(false);
    expect(access.canManageCustomers.value).toBe(false);
    expect(access.canCreateSales.value).toBe(false);
    expect(access.canManageSettings.value).toBe(false);
    expect(access.canManageUsers.value).toBe(false);
    expect(access.canManagePurchases.value).toBe(false);
    expect(access.canManageSuppliers.value).toBe(false);
    expect(access.canViewInventory.value).toBe(false);
    expect(access.canViewAccounting.value).toBe(false);
    expect(access.canAdjustStock.value).toBe(false);
    expect(access.canPrintBarcodes.value).toBe(false);
  });
});

describe('useAccess — reactivity on role change', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('computed updates when user role changes', () => {
    const authStore = useAuthStore();
    setUserRole(authStore, 'viewer');

    const access = useAccess();
    expect(access.canManageProducts.value).toBe(false);

    // Promote to admin
    setUserRole(authStore, 'admin');
    expect(access.canManageProducts.value).toBe(true);
  });
});
