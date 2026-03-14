import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { inventoryClient, productsClient } from '../api';
import type { InventoryMovement, Product, ProductBatch, ProductUnit } from '../types/domain';
import type { ProductInput } from '../types/domain';
import type {
  ProductBatchInput,
  ProductMovementFilters,
  ProductPurchaseHistoryItem,
  ProductSalesHistoryItem,
  ProductUnitInput,
  ProductWorkspaceFilters,
} from '../types/workspace';

interface LoadingState {
  products: boolean;
  product: boolean;
  movements: boolean;
  purchases: boolean;
  sales: boolean;
  units: boolean;
  batches: boolean;
  barcode: boolean;
  save: boolean;
  adjust: boolean;
}

const initialLoading = (): LoadingState => ({
  products: false,
  product: false,
  movements: false,
  purchases: false,
  sales: false,
  units: false,
  batches: false,
  barcode: false,
  save: false,
  adjust: false,
});

/** Type-safe error result for catch blocks. */
function failResult(code: string, message: string) {
  return { ok: false as const, error: { code, message } };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export const useProductWorkspaceStore = defineStore('productWorkspace', () => {
  const products = ref<Product[]>([]);
  const productsTotal = ref(0);
  const selectedProductId = ref<number | null>(null);
  const selectedProduct = ref<Product | null>(null);

  const movements = ref<InventoryMovement[]>([]);
  const movementsTotal = ref(0);

  const purchaseHistory = ref<ProductPurchaseHistoryItem[]>([]);
  const purchaseHistoryTotal = ref(0);

  const salesHistory = ref<ProductSalesHistoryItem[]>([]);
  const salesHistoryTotal = ref(0);

  const units = ref<ProductUnit[]>([]);
  const batches = ref<ProductBatch[]>([]);

  const filters = ref<ProductWorkspaceFilters>({
    search: '',
    limit: 50,
    offset: 0,
    expiringSoonOnly: false,
    lowStockOnly: false,
    categoryId: undefined,
    supplierId: undefined,
    status: undefined,
  });

  const loading = reactive<LoadingState>(initialLoading());
  const error = ref<string | null>(null);

  const isBusy = computed(() => Object.values(loading).some(Boolean));

  function resetError(): void {
    error.value = null;
  }

  function setError(message: string | undefined): void {
    error.value = message || 'Unknown workspace error';
  }

  /* ── Products list ──────────────────────────────────────────── */

  async function fetchProducts(next?: ProductWorkspaceFilters) {
    loading.products = true;
    resetError();
    try {
      filters.value = { ...filters.value, ...(next || {}) };
      const limit = filters.value.limit || 50;
      const offset = filters.value.offset || 0;
      const page = Math.floor(offset / limit) + 1;

      const result = await productsClient.getAll({
        ...filters.value,
        expiringSoonOnly: filters.value.expiringSoonOnly || false,
        page,
      });

      if (result.ok) {
        products.value = result.data.items;
        productsTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل المنتجات');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.products = false;
    }
  }

  /* ── Single product ─────────────────────────────────────────── */

  async function fetchProductById(productId: number) {
    loading.product = true;
    resetError();
    try {
      const result = await productsClient.getById(productId);
      if (result.ok) {
        selectedProductId.value = productId;
        selectedProduct.value = result.data;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل المنتج');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.product = false;
    }
  }

  /* ── Movements ──────────────────────────────────────────────── */

  async function fetchMovements(params: ProductMovementFilters) {
    loading.movements = true;
    resetError();
    try {
      const result = await inventoryClient.getMovements(params);
      if (result.ok) {
        movements.value = result.data.items;
        movementsTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل الحركات');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.movements = false;
    }
  }

  /* ── Purchase history ───────────────────────────────────────── */

  async function fetchPurchaseHistory(productId: number, limit = 50, offset = 0) {
    loading.purchases = true;
    resetError();
    try {
      const result = await productsClient.getPurchaseHistory(productId, { limit, offset });
      if (result.ok) {
        purchaseHistory.value = result.data.items;
        purchaseHistoryTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل سجل المشتريات');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.purchases = false;
    }
  }

  /* ── Sales history ──────────────────────────────────────────── */

  async function fetchSalesHistory(productId: number, limit = 50, offset = 0) {
    loading.sales = true;
    resetError();
    try {
      const result = await productsClient.getSalesHistory(productId, { limit, offset });
      if (result.ok) {
        salesHistory.value = result.data.items;
        salesHistoryTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل سجل المبيعات');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.sales = false;
    }
  }

  /* ── Units ──────────────────────────────────────────────────── */

  async function fetchUnits(productId: number) {
    loading.units = true;
    resetError();
    try {
      const result = await productsClient.getUnits(productId);
      if (result.ok) {
        units.value = result.data;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل الوحدات');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.units = false;
    }
  }

  async function upsertUnit(productId: number, input: ProductUnitInput, unitId?: number) {
    loading.units = true;
    resetError();
    try {
      const result = unitId
        ? await productsClient.updateUnit(unitId, input)
        : await productsClient.createUnit({
            ...input,
            productId,
            factorToBase: input.factorToBase ?? 1,
          });

      if (result.ok) {
        await fetchUnits(productId);
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في حفظ الوحدة');
      setError(msg);
      return failResult('UPSERT_FAILED', msg);
    } finally {
      loading.units = false;
    }
  }

  async function setDefaultUnit(productId: number, unitId: number) {
    loading.units = true;
    resetError();
    try {
      const result = await productsClient.setDefaultUnit(productId, unitId);
      if (result.ok) {
        await fetchUnits(productId);
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تعيين الوحدة الافتراضية');
      setError(msg);
      return failResult('SET_DEFAULT_FAILED', msg);
    } finally {
      loading.units = false;
    }
  }

  async function deleteUnit(productId: number, unitId: number) {
    loading.units = true;
    resetError();
    try {
      const result = await productsClient.deleteUnit(unitId);
      if (result.ok) {
        await fetchUnits(productId);
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في حذف الوحدة');
      setError(msg);
      return failResult('DELETE_FAILED', msg);
    } finally {
      loading.units = false;
    }
  }

  /* ── Batches ────────────────────────────────────────────────── */

  async function fetchBatches(productId: number) {
    loading.batches = true;
    resetError();
    try {
      const result = await productsClient.getBatches(productId);
      if (result.ok) {
        batches.value = result.data;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحميل الدفعات');
      setError(msg);
      return failResult('FETCH_FAILED', msg);
    } finally {
      loading.batches = false;
    }
  }

  async function createBatch(productId: number, input: ProductBatchInput) {
    loading.batches = true;
    resetError();
    try {
      const result = await productsClient.createBatch({ ...input, productId });
      if (result.ok) {
        await Promise.all([fetchBatches(productId), fetchProductById(productId)]);
        await fetchMovements({ productId, limit: 50, offset: 0 });
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في إنشاء الدفعة');
      setError(msg);
      return failResult('CREATE_FAILED', msg);
    } finally {
      loading.batches = false;
    }
  }

  /* ── CRUD ───────────────────────────────────────────────────── */

  async function createProduct(payload: ProductInput) {
    loading.save = true;
    resetError();
    try {
      const result = await productsClient.create(payload);
      if (result.ok) {
        await fetchProducts();
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في إنشاء المنتج');
      setError(msg);
      return failResult('CREATE_FAILED', msg);
    } finally {
      loading.save = false;
    }
  }

  async function updateProduct(productId: number, payload: ProductInput) {
    loading.save = true;
    resetError();
    try {
      const result = await productsClient.update(productId, payload);
      if (result.ok) {
        await Promise.all([fetchProducts(), fetchProductById(productId)]);
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تحديث المنتج');
      setError(msg);
      return failResult('UPDATE_FAILED', msg);
    } finally {
      loading.save = false;
    }
  }

  async function deleteProduct(productId: number) {
    loading.save = true;
    resetError();
    try {
      const result = await productsClient.delete(productId);
      if (result.ok) {
        if (selectedProductId.value === productId) {
          selectedProductId.value = null;
          selectedProduct.value = null;
        }
        await fetchProducts();
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في حذف المنتج');
      setError(msg);
      return failResult('DELETE_FAILED', msg);
    } finally {
      loading.save = false;
    }
  }

  /* ── Stock adjustment ───────────────────────────────────────── */

  async function adjustStock(payload: {
    productId: number;
    quantityBase: number;
    reason: 'manual' | 'damage' | 'opening';
    notes?: string;
    unitName?: string;
    unitFactor?: number;
    batchId?: number;
    idempotencyKey?: string;
  }) {
    loading.adjust = true;
    resetError();
    try {
      const result = await inventoryClient.adjustStock(payload);
      if (result.ok) {
        await Promise.all([
          fetchProductById(payload.productId),
          fetchMovements({ productId: payload.productId, limit: 50, offset: 0 }),
          fetchBatches(payload.productId),
        ]);
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'فشل في تعديل المخزون');
      setError(msg);
      return failResult('ADJUST_FAILED', msg);
    } finally {
      loading.adjust = false;
    }
  }

  /* ── Full workspace load ────────────────────────────────────── */

  async function loadProductWorkspace(productId: number) {
    const productResult = await fetchProductById(productId);

    // Don't fire 6 parallel requests if the product itself failed to load
    if (!productResult.ok) return;

    await Promise.all([
      fetchMovements({ productId, limit: 50, offset: 0 }),
      fetchPurchaseHistory(productId, 50, 0),
      fetchSalesHistory(productId, 50, 0),
      fetchUnits(productId),
      fetchBatches(productId),
    ]);
  }

  return {
    products,
    productsTotal,
    selectedProductId,
    selectedProduct,
    filters,
    movements,
    movementsTotal,
    purchaseHistory,
    purchaseHistoryTotal,
    salesHistory,
    salesHistoryTotal,
    units,
    batches,
    loading,
    isBusy,
    error,
    fetchProducts,
    fetchProductById,
    fetchMovements,
    fetchPurchaseHistory,
    fetchSalesHistory,
    fetchUnits,
    upsertUnit,
    setDefaultUnit,
    deleteUnit,
    fetchBatches,
    createBatch,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    loadProductWorkspace,
  };
});
