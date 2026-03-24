/**
 * usePosSearch — product search, filtering, and keyboard navigation.
 *
 * Owns: searchQuery, selectedCategory, dbCategories, highlightedProductIndex,
 * filteredProducts, barcode/search submission.
 */
import { computed, nextTick, ref } from 'vue';
import { categoriesClient } from '@/api';
import { t } from '@/i18n/t';
import { useProductsStore } from '@/stores/productsStore';
import type { Category, Product } from '@/types/domain';
import { notifyError, notifyWarn } from '@/utils/notify';
import {
  filterProducts,
  findProductByScanToken,
  normalizeToken,
} from '../services/posSearchService';

export function usePosSearch(
  /** Called whenever a product should be added to the cart. Returns false on failure. */
  safeAddFn: (product: Product) => Promise<boolean>,
  focusFn: () => void
) {
  const productsStore = useProductsStore();

  const searchQuery = ref('');
  const selectedCategory = ref<number | null>(null);
  const dbCategories = ref<Category[]>([]);
  const highlightedProductIndex = ref(-1);

  const categories = computed(() => {
    const all = [{ id: null as number | null, name: t('common.all') }];
    const active = dbCategories.value
      .filter((c) => c.isActive)
      .map((c) => ({ id: c.id ?? null, name: c.name }));
    return [...all, ...active];
  });

  const filteredProducts = computed(() =>
    filterProducts(productsStore.items, selectedCategory.value, searchQuery.value)
  );

  function selectCategory(id: number | null) {
    selectedCategory.value = id;
    highlightedProductIndex.value = -1;
  }

  function handleSearch() {
    highlightedProductIndex.value = -1;
  }

  function clearSearch() {
    searchQuery.value = '';
    highlightedProductIndex.value = -1;
  }

  function scrollHighlightIntoView() {
    if (highlightedProductIndex.value < 0) return;
    void nextTick(() => {
      document
        .querySelector('.pos-highlight')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function highlightNext() {
    const max = filteredProducts.value.length - 1;
    if (max < 0) return;
    highlightedProductIndex.value = Math.min(highlightedProductIndex.value + 1, max);
    scrollHighlightIntoView();
  }

  function highlightPrev() {
    if (highlightedProductIndex.value <= 0) {
      highlightedProductIndex.value = -1;
      return;
    }
    highlightedProductIndex.value -= 1;
    scrollHighlightIntoView();
  }

  async function handleSearchSubmit(): Promise<void> {
    const token = normalizeToken(searchQuery.value);
    if (!token || productsStore.loading) return;

    const product = findProductByScanToken(productsStore.items, token);
    if (!product) {
      notifyError(t('pos.barcodeNotFound'));
      clearSearch();
      focusFn();
      return;
    }

    await safeAddFn(product);
    clearSearch();
    focusFn();
  }

  async function handleSearchOrSelectSubmit(): Promise<void> {
    const idx = highlightedProductIndex.value;
    if (idx >= 0 && idx < filteredProducts.value.length) {
      const product = filteredProducts.value[idx];
      if (product) {
        await safeAddFn(product);
        highlightedProductIndex.value = -1;
        clearSearch();
        return;
      }
    }
    if (idx >= filteredProducts.value.length) {
      highlightedProductIndex.value = -1;
    }
    await handleSearchSubmit();
  }

  async function handleBarcodeScan(barcode: string): Promise<void> {
    let product: Product | null | undefined;
    try {
      product = await productsStore.findProductByBarcode(barcode);
    } catch {
      notifyError(t('pos.barcodeNotFound'));
      return;
    }

    if (!product) {
      notifyError(t('pos.barcodeNotFound'));
      return;
    }
    if (!product.isActive) {
      notifyWarn(t('pos.productInactive'));
      return;
    }

    await safeAddFn(product);
  }

  async function loadCategories(): Promise<void> {
    try {
      const result = await categoriesClient.getAll({});
      if (result.ok && result.data) {
        dbCategories.value = Array.isArray(result.data) ? result.data : [];
      }
    } catch {
      // Categories are non-critical — POS works without them
    }
  }

  return {
    searchQuery,
    selectedCategory,
    dbCategories,
    highlightedProductIndex,
    categories,
    filteredProducts,
    selectCategory,
    handleSearch,
    clearSearch,
    highlightNext,
    highlightPrev,
    handleSearchOrSelectSubmit,
    handleBarcodeScan,
    loadCategories,
  };
}
