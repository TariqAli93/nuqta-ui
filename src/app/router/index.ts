import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { routes } from './routes';
import { applyAuthGuard } from '../../auth/guards';
import { registerAuthNavigator } from '../../stores/authStore';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    permissions?: string[];
    requiresAccounting?: boolean;
    requiresPurchasing?: boolean;
    requiresLedgers?: boolean;
    requiresPaymentsOnInvoices?: boolean;
    enableBarcode?: 'pos' | 'product';
  }
}

const router = createRouter({
  // history: (import.meta as any).env.PROD ? createWebHashHistory() : createWebHistory(),
  history: createWebHistory(),
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
