/**
 * useRBAC — permission string-based access control composable.
 *
 * Provides a `can(permission)` method that maps backend-style permission
 * strings (e.g. 'sales:create', 'products:read') to the role-based access
 * rules already defined in src/auth/uiAccess.ts.
 *
 * This is a thin wrapper around useAccess() that allows components to use
 * a consistent `can()` API without directly coupling to role names.
 *
 * Usage:
 *   const { can } = useRBAC();
 *   if (can('sales:create')) { ... }
 *   // In templates:
 *   <v-btn v-if="can('products:update')">Edit</v-btn>
 */

import { computed } from 'vue';
import { useAccess } from './useAccess';

// ── Permission string to useAccess mapping ──────────────────────────────────

type PermissionString =
  | 'sales:read'
  | 'sales:create'
  | 'sales:refund'
  | 'sales:cancel'
  | 'products:read'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'customers:read'
  | 'customers:create'
  | 'customers:update'
  | 'suppliers:read'
  | 'suppliers:create'
  | 'suppliers:update'
  | 'purchases:read'
  | 'purchases:create'
  | 'inventory:read'
  | 'inventory:adjust'
  | 'hr:read'
  | 'hr:update'
  | 'payroll:read'
  | 'payroll:update'
  | 'payroll:approve'
  | 'accounting:read'
  | 'accounting:update'
  | 'settings:read'
  | 'settings:update'
  | 'users:read'
  | 'users:create'
  | 'users:update';

export function useRBAC() {
  const access = useAccess();

  /**
   * Map from permission string to the computed boolean from useAccess.
   * Multiple permission strings can map to the same underlying rule.
   */
  const permissionMap = computed<Record<string, boolean>>(() => ({
    // Sales
    'sales:read': access.canCreateSales.value,
    'sales:create': access.canCreateSales.value,
    'sales:refund': access.canManageProducts.value, // manager/admin
    'sales:cancel': access.canManageProducts.value,

    // Products
    'products:read': true, // all authenticated users
    'products:create': access.canManageProducts.value,
    'products:update': access.canManageProducts.value,
    'products:delete': access.canManageProducts.value,

    // Customers
    'customers:read': access.canManageCustomers.value,
    'customers:create': access.canManageCustomers.value,
    'customers:update': access.canManageCustomers.value,

    // Suppliers
    'suppliers:read': access.canManageSuppliers.value,
    'suppliers:create': access.canManageSuppliers.value,
    'suppliers:update': access.canManageSuppliers.value,

    // Purchases
    'purchases:read': access.canManagePurchases.value,
    'purchases:create': access.canManagePurchases.value,

    // Inventory
    'inventory:read': access.canViewInventory.value,
    'inventory:adjust': access.canAdjustStock.value,

    // HR & Payroll
    'hr:read': access.canViewInventory.value, // manager+ can view HR
    'hr:update': access.canManageProducts.value,
    'payroll:read': access.canViewInventory.value,
    'payroll:update': access.canManageProducts.value,
    'payroll:approve': access.canManageSettings.value, // admin only

    // Accounting
    'accounting:read': access.canViewAccounting.value,
    'accounting:update': access.canViewAccounting.value,

    // Settings
    'settings:read': access.canManageSettings.value,
    'settings:update': access.canManageSettings.value,

    // Users
    'users:read': access.canManageUsers.value,
    'users:create': access.canManageUsers.value,
    'users:update': access.canManageUsers.value,
  }));

  /**
   * Check if the currently authenticated user has the given permission.
   *
   * @param permission - A permission string like 'sales:create'
   * @returns true if the user's role grants this permission
   */
  function can(permission: PermissionString | string): boolean {
    return permissionMap.value[permission] ?? false;
  }

  /**
   * Check if the user has ANY of the given permissions (OR logic).
   */
  function canAny(...permissions: (PermissionString | string)[]): boolean {
    return permissions.some((p) => can(p));
  }

  /**
   * Check if the user has ALL of the given permissions (AND logic).
   */
  function canAll(...permissions: (PermissionString | string)[]): boolean {
    return permissions.every((p) => can(p));
  }

  return { can, canAny, canAll };
}
