/**
 * Shared formatting utilities — single source of truth.
 *
 * `formatDate`  — Arabic-Iraqi locale date string
 * `formatMoney` — number with thousands separator + currency symbol
 *
 * All formatters use cached Intl instances to avoid re-creation on every call.
 */
import { CURRENCY_SYMBOLS } from '../composables/useCurrency';

const _dateFormatter = new Intl.DateTimeFormat('ar-IQ', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  numberingSystem: 'latn',
});

/**
 * Format a date string for display in Arabic-Iraqi locale.
 * Returns '—' for falsy/missing input.
 */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return _dateFormatter.format(d);
}

const _moneyFormatter = new Intl.NumberFormat('en-US');

/**
 * Format a monetary value with thousands separator and currency symbol.
 * Defaults to IQD when no currency is specified.
 * For fully settings-aware formatting inside components, prefer `useCurrency().formatCurrency()`.
 */
export function formatMoney(value: number, currency = 'IQD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${_moneyFormatter.format(value || 0)} ${symbol}`;
}
