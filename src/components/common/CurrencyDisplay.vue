<template>
  <span
    :class="[
      'currency-display',
      colorClass,
      { 'font-weight-bold': bold },
    ]"
    style="font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: embed; white-space: nowrap"
  >
    <span v-if="showSign && amount > 0">+</span>
    <span v-else-if="showSign && amount < 0">−</span>
    {{ formattedAmount }}
    <span v-if="showSymbol" class="currency-symbol ms-1">{{ currencySymbol }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Amount in the smallest integer unit (IQD has no sub-unit). */
    amount: number;
    /** ISO 4217 currency code. Defaults to IQD. */
    currency?: string;
    /** Locale for number formatting. Defaults to 'ar-IQ' for IQD, 'en-US' otherwise. */
    locale?: string;
    /** Show the currency symbol after the amount. */
    showSymbol?: boolean;
    /** Show + prefix for positive amounts. */
    showSign?: boolean;
    /** Apply green/red color based on sign. */
    colored?: boolean;
    bold?: boolean;
  }>(),
  {
    currency: 'IQD',
    showSymbol: true,
    showSign: false,
    colored: false,
    bold: false,
  }
);

const ZERO_DECIMAL = new Set(['IQD', 'JPY', 'KWD', 'KRW', 'VND']);

const CURRENCY_SYMBOLS: Record<string, string> = {
  IQD: 'د.ع',
  USD: '$',
  EUR: '€',
  SAR: 'ر.س',
  KWD: 'د.ك',
};

const resolvedLocale = computed(() => {
  if (props.locale) return props.locale;
  return props.currency === 'IQD' ? 'ar-IQ' : 'en-US';
});

const formattedAmount = computed(() => {
  const decimals = ZERO_DECIMAL.has(props.currency ?? 'IQD') ? 0 : 2;
  const absAmount = Math.abs(props.amount);

  try {
    return new Intl.NumberFormat(resolvedLocale.value, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(absAmount);
  } catch {
    return absAmount.toLocaleString();
  }
});

const currencySymbol = computed(
  () => CURRENCY_SYMBOLS[props.currency ?? 'IQD'] ?? props.currency
);

const colorClass = computed(() => {
  if (!props.colored) return '';
  if (props.amount > 0) return 'text-success';
  if (props.amount < 0) return 'text-error';
  return '';
});
</script>
