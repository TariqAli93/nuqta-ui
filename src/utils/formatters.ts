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

export function formatDateRelative(value?: string | null): string {
  if (!value) return '—';

  console.log('formatDateRelative called with value:', value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffYear = Math.round(diffDay / 365);
  const diffMonth = Math.round(diffDay / 30);

  if (diffSec >= -60 && diffSec <= 60) return 'الآن';
  if (diffMin >= -60 && diffMin <= 60)
    return diffMin > 0 ? `بعد ${diffMin} دقيقة` : `${-diffMin} دقيقة مضت`;
  if (diffHour >= -48 && diffHour <= 48)
    return diffHour > 0 ? `بعد ${diffHour} ساعة` : `${-diffHour} ساعة مضت`;
  if (diffDay >= -30 && diffDay <= 30)
    return diffDay > 0 ? `بعد ${diffDay} يوم` : `${-diffDay} يوم مضت`;

  // what about months and years? for now, just show the absolute date
  if (diffDay > 0) return `بعد ${diffDay} يوم`;
  if (diffDay < 0) return `${-diffDay} يوم مضت`;
  if (diffMonth > 0) return `بعد ${diffMonth} شهر`;
  if (diffMonth < 0) return `${-diffMonth} شهر مضت`;
  if (diffYear > 0) return `بعد ${diffYear} سنة`;
  if (diffYear < 0) return `${-diffYear} سنة مضت`;
  return formatDate(value);
}

export function dateWithTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  });
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
