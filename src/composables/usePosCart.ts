/**
 * POS Cart composable — manages cart items, quantities, units, discounts, totals.
 *
 * Extracted from PosView to reduce component complexity.
 */
import { computed, ref } from 'vue';
import type { Product, SaleItem } from '@/types/domain';
import type { ProductUnit } from '@/types/domain';
import { productsClient } from '@/api';
import { t } from '@/i18n/t';

export function usePosCart() {
  const cartItems = ref<SaleItem[]>([]);

  // Cache of product units keyed by productId
  const productUnitsCache = ref<Map<number, ProductUnit[]>>(new Map());

  // Map of available units for each cart item index
  const cartItemUnitsMap = computed(() => {
    const map = new Map<number, ProductUnit[]>();
    cartItems.value.forEach((item, idx) => {
      const units = productUnitsCache.value.get(item.productId);
      if (units && units.length > 0) {
        map.set(
          idx,
          units.filter((u) => u.isActive)
        );
      }
    });
    return map;
  });

  const discount = ref(0);
  const tax = ref(0);
  const selectedCustomerId = ref<number | null>(null);
  const saleNote = ref<string | null>(null);

  const subtotal = computed(() =>
    cartItems.value.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
      0
    )
  );

  const total = computed(() => Math.max(0, subtotal.value - discount.value + tax.value));

  async function fetchProductUnits(productId: number): Promise<ProductUnit[]> {
    if (productUnitsCache.value.has(productId)) {
      return productUnitsCache.value.get(productId)!;
    }
    try {
      const result = await productsClient.getUnits(productId);
      const units = result.ok ? (result.data ?? []) : [];
      productUnitsCache.value.set(productId, units);
      return units;
    } catch {
      return [];
    }
  }

  async function addToCart(product: Product): Promise<boolean> {
    const productId = product.id ?? 0;

    const units = await fetchProductUnits(productId);
    const activeUnits = units.filter((u) => u.isActive);
    const defaultUnit = activeUnits.find((u) => u.isDefault) || activeUnits[0];

    const unitPrice = defaultUnit?.sellingPrice ?? product.sellingPrice;
    const unitName = defaultUnit?.unitName ?? product.unit ?? 'pcs';
    const unitFactor = defaultUnit?.factorToBase ?? 1;

    if (unitPrice <= 0) {
      const proceed = confirm(t('pos.zeroPriceWarning'));
      if (!proceed) return false;
    }

    const existingIndex = cartItems.value.findIndex(
      (item) => item.productId === productId && item.unitName === unitName
    );

    if (existingIndex >= 0) {
      cartItems.value[existingIndex].quantity += 1;
    } else {
      cartItems.value.push({
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice,
        discount: 0,
        subtotal: unitPrice,
        unitName,
        unitFactor,
      });
    }

    return true;
  }

  function handleUnitChange(payload: { index: number; unit: ProductUnit }) {
    const item = cartItems.value[payload.index];
    if (!item) return;
    item.unitName = payload.unit.unitName;
    item.unitFactor = payload.unit.factorToBase;
    item.unitPrice = payload.unit.sellingPrice ?? item.unitPrice;
    item.subtotal = item.quantity * item.unitPrice - (item.discount || 0);
  }

  function increaseQuantity(index: number) {
    cartItems.value[index].quantity += 1;
  }

  function decreaseQuantity(index: number) {
    const item = cartItems.value[index];
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      removeFromCart(index);
    }
  }

  function removeFromCart(index: number): 'removed' | 'confirm-needed' {
    if (cartItems.value.length === 1) {
      return 'confirm-needed';
    }
    cartItems.value.splice(index, 1);
    return 'removed';
  }

  function confirmRemoveAt(index: number) {
    cartItems.value.splice(index, 1);
  }

  function resetCart() {
    cartItems.value = [];
    discount.value = 0;
    tax.value = 0;
    selectedCustomerId.value = null;
    saleNote.value = null;
  }

  function applyDiscount(amount: number) {
    if (amount >= 0 && amount <= subtotal.value) {
      discount.value = amount;
    }
  }

  return {
    cartItems,
    cartItemUnitsMap,
    discount,
    tax,
    selectedCustomerId,
    saleNote,
    subtotal,
    total,
    addToCart,
    handleUnitChange,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    confirmRemoveAt,
    resetCart,
    applyDiscount,
  };
}
