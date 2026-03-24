/**
 * posSearchService — pure product-search helpers.
 * No Vue refs. No side effects. Fully testable in isolation.
 */
import type { Product } from '@/types/domain';

export function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Find the first active product whose barcode or SKU is an exact
 * case-insensitive match for `scanToken`.
 */
export function findProductByScanToken(
  products: Product[],
  scanToken: string
): Product | undefined {
  const token = normalizeToken(scanToken);
  return products.find((product) => {
    if (!product.isActive) return false;
    const barcode = normalizeToken(product.barcode ?? '');
    const sku = normalizeToken(product.sku ?? '');
    return barcode === token || sku === token;
  });
}

/**
 * Filter an active-products list by optional category and a free-text query
 * that matches name, SKU, or barcode.
 */
export function filterProducts(
  products: Product[],
  categoryId: number | null,
  query: string
): Product[] {
  let result = products.filter((p) => p.isActive);

  if (categoryId !== null) {
    result = result.filter((p) => p.categoryId === categoryId);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }

  return result;
}
