import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  inventoryClient,
  type InventoryDashboard,
  type ExpiryAlert,
  type StockAdjustmentInput,
  type StockReconciliationResult,
} from '../api/endpoints/inventory';
import type { InventoryMovement } from '../types/domain';

export const useInventoryStore = defineStore('inventory', () => {
  const movements = ref<InventoryMovement[]>([]);
  const movementsTotal = ref(0);
  const dashboard = ref<InventoryDashboard | null>(null);
  const expiryAlerts = ref<ExpiryAlert[]>([]);
  const reconciliation = ref<StockReconciliationResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDashboard() {
    loading.value = true;
    error.value = null;
    try {
      const result = await inventoryClient.getDashboard();
      if (result.ok) {
        dashboard.value = result.data;
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل لوحة المخزون';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchMovements(params?: {
    productId?: number;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await inventoryClient.getMovements(params);
      if (result.ok) {
        movements.value = result.data.items;
        movementsTotal.value = result.data.total;
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل حركات المخزون';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function fetchExpiryAlerts(daysAhead?: number) {
    try {
      const result = await inventoryClient.getExpiryAlerts(daysAhead);
      if (result.ok) {
        expiryAlerts.value = result.data;
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل تنبيهات الصلاحية';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    }
  }

  async function adjustStock(data: StockAdjustmentInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await inventoryClient.adjustStock(data);
      if (!result.ok) error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تعديل المخزون';
      return { ok: false as const, error: { code: 'ADJUST_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function reconcileStock(repair = false) {
    loading.value = true;
    error.value = null;
    try {
      const result = await inventoryClient.reconcileStock(repair);
      if (result.ok) {
        reconciliation.value = result.data;
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في مطابقة المخزون';
      return { ok: false as const, error: { code: 'RECONCILE_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  return {
    movements,
    movementsTotal,
    dashboard,
    expiryAlerts,
    reconciliation,
    loading,
    error,
    fetchDashboard,
    fetchMovements,
    fetchExpiryAlerts,
    reconcileStock,
    adjustStock,
  };
});
