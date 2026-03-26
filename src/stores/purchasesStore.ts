import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import {
  purchasesClient,
  type PurchaseCreateInput,
  type PurchasePaymentInput,
} from '../api/endpoints/purchases';
import type { Purchase } from '../types/domain';
import { generateIdempotencyKey } from '../utils/idempotency';

export const usePurchasesStore = defineStore(
  'purchases',
  () => {
    const items = shallowRef<Purchase[]>([]);
    const total = ref(0);
    const currentPurchase = ref<Purchase | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchPurchases(params?: {
      search?: string;
      supplierId?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }) {
      loading.value = true;
      error.value = null;
      const result = await purchasesClient.getAll(params);
      if (result.ok) {
        items.value = result.data.items;
        total.value = result.data.total;
      } else {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function fetchPurchaseById(id: number) {
      loading.value = true;
      error.value = null;
      const result = await purchasesClient.getById(id);
      if (result.ok) {
        currentPurchase.value = result.data;
      } else {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function createPurchase(data: PurchaseCreateInput) {
      loading.value = true;
      error.value = null;
      const result = await purchasesClient.create(data);
      if (!result.ok) error.value = result.error.message;
      loading.value = false;
      return result;
    }

    /**
     * Record a payment against a purchase.
     * On success, updates currentPurchase with the backend response directly —
     * no stale values, no manual recalculation.
     */
    async function addPayment(
      data: Omit<PurchasePaymentInput, 'idempotencyKey'> & { idempotencyKey?: string }
    ) {
      loading.value = true;
      error.value = null;
      try {
        const result = await purchasesClient.addPayment({
          ...data,
          idempotencyKey: data.idempotencyKey || generateIdempotencyKey('purchase-payment'),
        });
        if (result.ok) {
          currentPurchase.value = result.data;
        } else {
          error.value = result.error.message;
        }
        return result;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'فشل في تسجيل الدفعة';
        return { ok: false as const, error: { code: 'PAYMENT_FAILED', message: error.value! } };
      } finally {
        loading.value = false;
      }
    }

    return {
      items,
      total,
      currentPurchase,
      loading,
      error,
      fetchPurchases,
      fetchPurchaseById,
      createPurchase,
      addPayment,
    };
  },
  { persist: true }
);
