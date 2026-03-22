import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  inventoryClient,
  type InventoryDashboard,
  type ExpiryAlert,
  type StockAdjustmentInput,
  type StockReconciliationResult,
} from '../api/endpoints/inventory';
import type { InventoryMovement } from '../types/domain';

export const useInventoryStore = defineStore('inventory', () => {
  /* ── State ───────────────────────────────────────────────────── */
  const movements = ref<InventoryMovement[]>([]);
  const movementsTotal = ref(0);
  const dashboard = ref<InventoryDashboard | null>(null);
  const expiryAlerts = ref<ExpiryAlert[]>([]);
  const reconciliation = ref<StockReconciliationResult | null>(null);
  const repairedCount = ref(0);

  // Per-action loading flags — avoids the race when parallel calls
  // share a single boolean (first to finish hides everyone's spinner).
  const loadingDashboard = ref(false);
  const loadingMovements = ref(false);
  const loadingAlerts = ref(false);
  const loadingAdjust = ref(false);
  const loadingReconciliation = ref(false);

  /** Aggregate flag for UI that just wants "anything loading". */
  const loading = computed(
    () =>
      loadingDashboard.value ||
      loadingMovements.value ||
      loadingAlerts.value ||
      loadingAdjust.value ||
      loadingReconciliation.value
  );

  const error = ref<string | null>(null);

  /* ── Actions ─────────────────────────────────────────────────── */

  async function fetchDashboard() {
    loadingDashboard.value = true;
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
      loadingDashboard.value = false;
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
    loadingMovements.value = true;
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
      loadingMovements.value = false;
    }
  }

  async function fetchExpiryAlerts(daysAhead?: number) {
    // Lightweight background refresh — does not toggle the aggregate loading flag
    // so the UI is not disrupted while expiry data refreshes silently.
    // Components that specifically need to track expiry alert loading can use
    // the `loadingAlerts` flag directly; it is left false intentionally here.
    error.value = null;
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
    loadingAdjust.value = true;
    error.value = null;
    try {
      const result = await inventoryClient.adjustStock(data);
      if (!result.ok) error.value = result.error.message;
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تعديل المخزون';
      return { ok: false as const, error: { code: 'ADJUST_FAILED', message: error.value! } };
    } finally {
      loadingAdjust.value = false;
    }
  }

  async function reconcileStock(repair = false) {
    loadingReconciliation.value = true;
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
      loadingReconciliation.value = false;
    }
  }

  async function repairDrift() {
    loadingReconciliation.value = true;
    error.value = null;
    try {
      // POST /inventory/reconcile with repair=true — backend fixes all drift and
      // returns { items: [], total: 0, totalDrift: 0, corrected: N }.
      const result = await inventoryClient.reconcileStock(true);
      if (result.ok) {
        repairedCount.value = result.data.corrected ?? 0;
        // Re-fetch drift list so the table shows the post-repair state.
        await reconcileStock(false);
      } else {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في إصلاح الفروقات';
      return { ok: false as const, error: { code: 'REPAIR_FAILED', message: error.value! } };
    } finally {
      loadingReconciliation.value = false;
    }
  }

  return {
    // State
    movements,
    movementsTotal,
    dashboard,
    expiryAlerts,
    reconciliation,
    repairedCount,

    // Loading flags
    loading,
    loadingDashboard,
    loadingMovements,
    loadingAlerts,
    loadingAdjust,
    loadingReconciliation,

    error,

    // Actions
    fetchDashboard,
    fetchMovements,
    fetchExpiryAlerts,
    adjustStock,
    reconcileStock,
    repairDrift,
  };
});
