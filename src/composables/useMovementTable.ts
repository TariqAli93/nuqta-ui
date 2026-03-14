import { computed } from 'vue';
import { useProductsStore } from '@/stores/productsStore';

/**
 * Shared definitions for the movement data-table used in
 * StockOverviewView and StockMovementsView.
 *
 * Provides an O(1) product-name lookup via a computed Map
 * (replaces the old `.find()` per row).
 */
export function useMovementTable() {
  const productsStore = useProductsStore();

  /** O(1) lookup — rebuilt only when the products array changes. */
  const productMap = computed(() => {
    const map = new Map<number, string>();
    for (const p of productsStore.items) {
      map.set(p.id, p.name);
    }
    return map;
  });

  function getProductName(productId: number): string {
    return productMap.value.get(productId) ?? `منتج #${productId}`;
  }

  const movementHeaders = [
    { title: 'المنتج', key: 'productName', width: 80 },
    { title: 'التاريخ', key: 'createdAt', width: 130 },
    { title: 'النوع', key: 'movementType', width: 80 },
    { title: 'السبب', key: 'reason', width: 100 },
    { title: 'المصدر', key: 'sourceType', width: 100 },
    { title: 'الكمية', key: 'quantityBase', align: 'center' as const, width: 80 },
    { title: 'قبل', key: 'stockBefore', align: 'center' as const, width: 70 },
    { title: 'بعد', key: 'stockAfter', align: 'center' as const, width: 70 },
  ];

  /** Ensure the products list is loaded (call once in onMounted). */
  async function ensureProducts(): Promise<void> {
    if (productsStore.items.length === 0) {
      await productsStore.fetchProducts({ limit: 100, page: 1 });
    }
  }

  return { movementHeaders, getProductName, ensureProducts };
}
