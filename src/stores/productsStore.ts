import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { productsClient } from '../api';
import type { Product, ProductInput } from '../types/domain';

export const useProductsStore = defineStore(
  'products',
  () => {
    // shallowRef: product list can be large; items are replaced wholesale
    const items = shallowRef<Product[]>([]);
    const total = ref(0);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Barcode cache — we reassign the whole Map (not mutate) so Vue tracks changes.
    const barcodeCache = ref<Map<string, Product>>(new Map());

    function rebuildBarcodeCache(): void {
      const next = new Map<string, Product>();
      for (const product of items.value) {
        if (product.barcode) {
          next.set(product.barcode, product);
        }
      }
      barcodeCache.value = next; // reactive reassignment
    }

    async function fetchProducts(params?: { search?: string; page?: number; limit?: number }) {
      loading.value = true;
      error.value = null;
      try {
        const result = await productsClient.getAll(params);
        if (result.ok) {
          items.value = result.data.items;
          total.value = result.data.total;
          rebuildBarcodeCache();
        } else {
          error.value = result.error.message;
        }
        return result;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'فشل في تحميل المنتجات';
        return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
      } finally {
        loading.value = false;
      }
    }

    async function createProduct(payload: ProductInput) {
      loading.value = true;
      error.value = null;
      try {
        const result = await productsClient.create(payload);
        if (!result.ok) error.value = result.error.message;
        return result;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'فشل في إنشاء المنتج';
        return { ok: false as const, error: { code: 'CREATE_FAILED', message: error.value! } };
      } finally {
        loading.value = false;
      }
    }

    async function updateProduct(id: number, payload: ProductInput) {
      loading.value = true;
      error.value = null;
      try {
        const result = await productsClient.update(id, payload);
        if (!result.ok) error.value = result.error.message;
        return result;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'فشل في تحديث المنتج';
        return { ok: false as const, error: { code: 'UPDATE_FAILED', message: error.value! } };
      } finally {
        loading.value = false;
      }
    }

    async function deleteProduct(id: number) {
      loading.value = true;
      error.value = null;
      try {
        const result = await productsClient.delete(id);
        if (!result.ok) error.value = result.error.message;
        return result;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'فشل في حذف المنتج';
        return { ok: false as const, error: { code: 'DELETE_FAILED', message: error.value! } };
      } finally {
        loading.value = false;
      }
    }

    async function fetchProductById(id: number) {
      loading.value = true;
      error.value = null;
      try {
        const result = await productsClient.getById(id);
        if (!result.ok) error.value = result.error.message;
        return result;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'فشل في تحميل المنتج';
        return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
      } finally {
        loading.value = false;
      }
    }

    async function findProductByBarcode(barcode: string): Promise<Product | null> {
      // Fast path — cache hit
      const cached = barcodeCache.value.get(barcode);
      if (cached) return cached;

      // Slow path — API lookup
      try {
        const result = await productsClient.findByBarcode(barcode);
        if (result.ok && result.data) {
          // Rebuild map with the new entry so Vue sees the change
          const next = new Map(barcodeCache.value);
          next.set(barcode, result.data);
          barcodeCache.value = next;
          return result.data;
        }
      } catch {
        // Barcode lookup failure is non-fatal — just return null
      }

      return null;
    }

    return {
      items,
      total,
      loading,
      error,
      fetchProducts,
      fetchProductById,
      createProduct,
      updateProduct,
      deleteProduct,
      findProductByBarcode,
      rebuildBarcodeCache,
    };
  },
  { persist: true }
);
