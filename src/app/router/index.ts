import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import type { UserRole } from '../../types/domain';
import { routes } from './routes';
import { applyAuthGuard } from '../../auth/guards';
import { registerAuthNavigator } from '../../stores/authStore';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresManageProducts?: boolean;
    requiresManageCustomers?: boolean;
    requiresCreateSales?: boolean;
    requiresManageSettings?: boolean;
    requiresManagePurchases?: boolean;
    requiresManageSuppliers?: boolean;
    requiresViewInventory?: boolean;
    requiresViewAccounting?: boolean;
    requiresAdjustStock?: boolean;
    requiresAccounting?: boolean;
    requiresPurchasing?: boolean;
    requiresLedgers?: boolean;
    requiresPaymentsOnInvoices?: boolean;
    requiresRole?: UserRole;
    enableBarcode?: 'pos' | 'product';
  }
}

const router = createRouter({
  history: (import.meta as any).env.PROD ? createWebHashHistory() : createWebHistory(),
  routes,
});

// Wire the auth store → router navigation (avoids store importing router directly)
registerAuthNavigator(() => {
  const currentPath = router.currentRoute.value.fullPath;
  void router.replace({
    name: 'Login',
    query: { redirect: currentPath },
  });
});

applyAuthGuard(router);

export default router;
