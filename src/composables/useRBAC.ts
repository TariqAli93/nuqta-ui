/**
 * useRBAC — permission-based access control composable.
 *
 * Single source of truth for UI permission checks.
 * Reads permissions directly from authStore.permissions (backend-provided).
 *
 * Usage:
 *   const { can } = useRBAC();
 *   if (can('sales:create')) { ... }
 *   // In templates:
 *   <v-btn v-if="can('products:update')">Edit</v-btn>
 */

import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';

export type PermissionString =
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
  | 'users:update'
  | 'barcodes:print'
  | 'backup:read';

export function useRBAC() {
  const authStore = useAuthStore();

  const permissionSet = computed(() => new Set(authStore.permissions));

  /**
   * Check if the currently authenticated user has the given permission.
   */
  function can(permission: PermissionString | string): boolean {
    return permissionSet.value.has(permission);
  }

  /**
   * Check if the user has ANY of the given permissions (OR logic).
   */
  function canAny(...permissions: (PermissionString | string)[]): boolean {
    return permissions.some((p) => permissionSet.value.has(p));
  }

  /**
   * Check if the user has ALL of the given permissions (AND logic).
   */
  function canAll(...permissions: (PermissionString | string)[]): boolean {
    return permissions.every((p) => permissionSet.value.has(p));
  }

  return { can, canAny, canAll };
}
