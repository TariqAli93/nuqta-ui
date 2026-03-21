import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { salesClient } from '../api';
import type { SaleReceiptData, SettlePayload } from '../api/endpoints/sales';
import type { Payment, Sale, SaleCreateInput } from '../types/domain';
import { generateIdempotencyKey } from '../utils/idempotency';

export const useSalesStore = defineStore('sales', () => {
  const items = shallowRef<Sale[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSales(params?: Record<string, unknown>) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.getAll(params);
      if (result.ok) {
        items.value = result.data.items;
        total.value = result.data.total;
      } else {
        error.value = result.error.message;
      }
      console.log('Fetched sales:', result);
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل المبيعات';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function createSale(payload: SaleCreateInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.create(payload);
      if (!result.ok) {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل في إنشاء عملية البيع';
      error.value = message;
      return { ok: false as const, error: { code: 'CREATE_FAILED', message } };
    } finally {
      loading.value = false;
    }
  }

  async function addPayment(id: number, payment: Payment) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.addPayment(id, {
        ...payment,
        idempotencyKey: payment.idempotencyKey || generateIdempotencyKey('sale-payment'),
      });
      if (!result.ok) {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في إضافة الدفعة';
      return { ok: false as const, error: { code: 'PAYMENT_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function getSale(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.getById(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تحميل عملية البيع';
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function cancelSale(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.cancel(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في إلغاء عملية البيع';
      return { ok: false as const, error: { code: 'CANCEL_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function generateReceipt(saleId: number): Promise<SaleReceiptData> {
    const result = await salesClient.generateReceipt(saleId);
    if (result.ok) {
      return result.data;
    } else {
      throw new Error(result.error.message || 'Failed to generate receipt');
    }
  }

  async function refundSale(id: number, amount: number, reason: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.refund(id, amount, reason);
      if (!result.ok) {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في استرجاع عملية البيع';
      return { ok: false as const, error: { code: 'REFUND_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  async function settleSale(id: number, payload?: SettlePayload) {
    loading.value = true;
    error.value = null;
    try {
      const result = await salesClient.settle(id, {
        ...payload,
        idempotencyKey: payload?.idempotencyKey || generateIdempotencyKey('sale-settle'),
      });
      if (!result.ok) {
        error.value = result.error.message;
      }
      return result;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'فشل في تسوية عملية البيع';
      return { ok: false as const, error: { code: 'SETTLE_FAILED', message: error.value! } };
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    total,
    loading,
    error,
    fetchSales,
    createSale,
    addPayment,
    getSale,
    cancelSale,
    refundSale,
    generateReceipt,
    settleSale,
  };
});
