/**
 * Price formatting utility for POS display.
 * Uses a cached Intl instance for performance.
 */
const _priceFormatter = new Intl.NumberFormat('ar-IQ', {
  style: 'currency',
  currency: 'IQD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  numberingSystem: 'latn',
});

export function formatPrice(price: number): string {
  return _priceFormatter.format(price);
}
