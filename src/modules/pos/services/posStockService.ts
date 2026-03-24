/**
 * posStockService — pure functions for stock-error normalisation.
 * No Vue refs. No side effects.
 */

/**
 * Extract unavailable product names from an INSUFFICIENT_STOCK error details blob.
 *
 * Backend shapes handled:
 *   - Array of strings
 *   - Array of objects with `productName` or `name`
 *   - Single object with `productName` or `name`
 *
 * Falls back to `fallbackNames` when nothing useful is found.
 */
export function extractUnavailableProducts(details: unknown, fallbackNames: string[]): string[] {
  if (Array.isArray(details)) {
    const names = details
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d && typeof d === 'object') {
          const obj = d as Record<string, unknown>;
          const name = obj.productName ?? obj.name;
          return typeof name === 'string' ? name : undefined;
        }
        return undefined;
      })
      .filter((n): n is string => Boolean(n));

    if (names.length > 0) return names;
  }

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const obj = details as Record<string, unknown>;
    const name = obj.productName ?? obj.name;
    if (typeof name === 'string') return [name];
  }

  return fallbackNames;
}
