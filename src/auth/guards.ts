import type { Router } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useFeatureFlagsStore } from '../stores/featureFlagsStore';
import * as uiAccess from './uiAccess';

export function applyAuthGuard(router: Router): void {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    const featureFlagsStore = useFeatureFlagsStore();

    // Lazy-load setup status if not yet fetched
    if (!authStore.setupStatus) {
      try {
        const result = await authStore.checkInitialSetup();
        if (!result.ok) {
          throw new Error('Failed to check initial setup status');
        }

        // If the user is already past the initial setup, ensure we have their auth status
        if (result.data.isInitialized && !authStore.user) {
          await authStore.ensureAuthenticated();
        }
      } catch {
        // Backend unreachable — if we have a stored token the app was previously
        // initialized; synthesise a minimal setupStatus so the user isn't blocked.
        if (authStore.token) {
          authStore.setupStatus = {
            isInitialized: true,
            hasUsers: true,
            hasCompanyInfo: true,
            wizardCompleted: true,
          };
        }
      }
    }

    // Treat app as initialized when the flag is set OR when users already exist
    // (covers partial-init where app_initialized wasn't persisted).
    const appReady = authStore.setupStatus?.isInitialized || authStore.setupStatus?.hasUsers;

    if (to.name === 'InitialSetup') {
      if (appReady) {
        const isAuth = await authStore.ensureAuthenticated();
        return isAuth ? { path: '/' } : { name: 'Login' };
      }
      return true;
    }

    // Block app until initial setup is completed.
    if (authStore.setupStatus && !appReady) {
      return { name: 'InitialSetup' };
    }

    if (to.meta.requiresGuest) {
      const isAuth = await authStore.ensureAuthenticated();
      if (isAuth) {
        return { name: 'Dashboard' };
      }
      return true;
    }

    if (to.meta.requiresAuth) {
      const isAuthenticated = authStore.isAuthenticated;
      if (!isAuthenticated) {
        authStore.logout('not_authenticated');
        return { name: 'Login', query: { redirect: to.fullPath } };
      }

      authStore.startSessionCheck();

      const role = authStore.user?.role;
      if (!role) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresManageProducts && !uiAccess.canManageProducts(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresManageCustomers && !uiAccess.canManageCustomers(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresCreateSales && !uiAccess.canCreateSales(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresManageSettings && !uiAccess.canManageSettings(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresManagePurchases && !uiAccess.canManagePurchases(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresManageSuppliers && !uiAccess.canManageSuppliers(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresViewInventory && !uiAccess.canViewInventory(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresViewAccounting && !uiAccess.canViewAccounting(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresAdjustStock && !uiAccess.canAdjustStock(role)) {
        return { name: 'Forbidden' };
      }

      if (to.meta.requiresRole && role !== to.meta.requiresRole) {
        return { name: 'Forbidden' };
      }

      const needsFeatureFlags = Boolean(
        to.meta.requiresAccounting ||
        to.meta.requiresPurchasing ||
        to.meta.requiresLedgers ||
        to.meta.requiresPaymentsOnInvoices
      );

      if (needsFeatureFlags && !featureFlagsStore.initialized && !featureFlagsStore.loading) {
        await featureFlagsStore.hydrate();
      }

      if (featureFlagsStore.initialized && role !== 'admin') {
        if (to.meta.requiresAccounting && !featureFlagsStore.accountingReady) {
          return { name: 'Forbidden' };
        }

        if (to.meta.requiresPurchasing && !featureFlagsStore.purchasesEnabled) {
          return { name: 'Forbidden' };
        }

        if (to.meta.requiresLedgers && !featureFlagsStore.ledgersEnabled) {
          return { name: 'Forbidden' };
        }

        if (to.meta.requiresPaymentsOnInvoices && !featureFlagsStore.paymentsOnInvoicesEnabled) {
          return { name: 'Forbidden' };
        }
      }
    }

    return true;
  });
}
