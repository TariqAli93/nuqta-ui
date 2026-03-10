import { ref, computed, getCurrentInstance, onMounted } from 'vue';
import { settingsClient } from '../api/endpoints/settings';
import type { CompanySettings } from '../types/domain';

const companySettings = ref<CompanySettings | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Currency symbol mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  IQD: 'د.ع',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SAR: 'ر.س',
  AED: 'د.إ',
  EGP: 'ج.م',
  JOD: 'د.ا',
  KWD: 'د.ك',
};

// Zero-decimal currencies where amounts are always whole numbers
const ZERO_DECIMAL_CURRENCIES = new Set(['IQD', 'JPY', 'KWD', 'KRW', 'VND']);

/**
 * Composable for accessing the single source of truth for currency.
 * This enforces that all prices, totals, and monetary calculations use
 * only the default currency defined in CompanySettings.
 */
export function useCurrency() {
  const fetchCompanySettings = async (force = false) => {
    if (companySettings.value && !force) return;

    isLoading.value = true;
    error.value = null;

    try {
      const result = await settingsClient.getCompany();
      if (result.ok && result.data) {
        companySettings.value = result.data;
      } else if (!result.ok) {
        error.value = result.error?.message || 'Failed to load company settings';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  };

  /** Update local settings without a network call (e.g. after store save). */
  function applyCompanySettings(updated: CompanySettings): void {
    companySettings.value = updated;
  }

  const currency = computed(() => companySettings.value?.currency || 'IQD');
  const currencySymbol = computed(() => CURRENCY_SYMBOLS[currency.value] || currency.value);
  const lowStockThreshold = computed(() => companySettings.value?.lowStockThreshold ?? 5);
  const isZeroDecimal = computed(() => ZERO_DECIMAL_CURRENCIES.has(currency.value));

  // Cached Intl.NumberFormat instances keyed by decimals to avoid re-creation
  const _fmtCache = new Map<number, Intl.NumberFormat>();
  function _getFormatter(decimals: number): Intl.NumberFormat {
    let fmt = _fmtCache.get(decimals);
    if (!fmt) {
      fmt = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      _fmtCache.set(decimals, fmt);
    }
    return fmt;
  }

  /**
   * Formats a number as currency using the system's single currency.
   * Uses cached Intl.NumberFormat for performance (avoids re-creation per call).
   * @param amount - The numeric amount to format
   * @param options - Optional formatting options
   */
  const formatCurrency = (
    amount: number,
    options?: { showSymbol?: boolean; decimals?: number }
  ): string => {
    const defaultDecimals = isZeroDecimal.value ? 0 : 2;
    const { showSymbol = true, decimals = defaultDecimals } = options || {};
    const formatted = _getFormatter(decimals).format(amount || 0);
    return showSymbol ? `${formatted} ${currencySymbol.value}` : formatted;
  };

  /**
   * Check if a product's stock is at or below the low stock threshold.
   */
  const isLowStock = (stock: number): boolean => {
    return stock > 0 && stock <= lowStockThreshold.value;
  };

  /**
   * Check if a product is out of stock.
   */
  const isOutOfStock = (stock: number): boolean => {
    return stock <= 0;
  };

  // Auto-fetch only when the composable is used inside component setup.
  if (getCurrentInstance()) {
    onMounted(() => {
      void fetchCompanySettings();
    });
  }

  return {
    companySettings: computed(() => companySettings.value),
    currency,
    currencySymbol,
    lowStockThreshold,
    isZeroDecimal,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    formatCurrency,
    isLowStock,
    isOutOfStock,
    refetch: fetchCompanySettings,
    applyCompanySettings,
  };
}
