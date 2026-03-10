/**
 * POS Held Sales composable — manages held (parked) sales in localStorage.
 *
 * Extracted from PosView to reduce component complexity.
 */
import { ref } from 'vue';
import type { SaleItem } from '@/types/domain';
import { notifyError } from '@/utils/notify';
import { t } from '@/i18n/t';

export interface HeldSale {
  name: string;
  items: SaleItem[];
  discount: number;
  tax: number;
  customerId: number | null;
  note: string | null;
  total: number;
  timestamp: number;
}

const STORAGE_KEY = 'nuqta_held_sales';

export function usePosHeldSales() {
  const heldSales = ref<HeldSale[]>([]);

  function loadHeldSales() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        heldSales.value = JSON.parse(stored);
      }
    } catch {
      heldSales.value = [];
      notifyError(t('errors.unexpected'));
    }
  }

  function saveHeldSales() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(heldSales.value));
    } catch {
      notifyError(t('errors.unexpected'));
    }
  }

  function holdSale(sale: HeldSale) {
    heldSales.value.push(sale);
    saveHeldSales();
  }

  function resumeSale(index: number): HeldSale | null {
    const sale = heldSales.value[index];
    if (!sale) return null;

    heldSales.value.splice(index, 1);
    saveHeldSales();
    return JSON.parse(JSON.stringify(sale));
  }

  function deleteHeldSale(index: number): boolean {
    if (confirm(t('pos.confirmDeleteHeldSale'))) {
      heldSales.value.splice(index, 1);
      saveHeldSales();
      return true;
    }
    return false;
  }

  function heldSaleName(sale: HeldSale, index: number): string {
    return sale.name || `عملية ${index + 1}`;
  }

  return {
    heldSales,
    loadHeldSales,
    holdSale,
    resumeSale,
    deleteHeldSale,
    heldSaleName,
  };
}
