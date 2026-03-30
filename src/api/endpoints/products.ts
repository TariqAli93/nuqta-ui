/**
 * Products API endpoints.
 *
 * Replaces: ipc/productsClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Product, ProductInput, ProductBatch, ProductUnit } from '../../types/domain';
import type { ProductPurchaseHistoryItem, ProductSalesHistoryItem } from '../../types/workspace';
import { apiGet, apiGetPaged, apiPost, apiPut, apiDelete } from '../http';

interface ProductUnitInput {
  productId: number;
  unitName: string;
  factorToBase: number;
  barcode?: string | null;
  sellingPrice?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
}

interface ProductBatchInput {
  productId: number;
  batchNumber: string;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  quantityReceived: number;
  quantityOnHand?: number;
  costPerUnit?: number | null;
  purchaseId?: number | null;
  status?: string;
  notes?: string | null;
}

export const productsClient = {
  getAll: (params?: {
    search?: string;
    page?: number;
    limit?: number;
    categoryId?: number;
    supplierId?: number;
    status?: string;
    lowStockOnly?: boolean;
    expiringSoonOnly?: boolean;
    isExpire?: boolean;
  }): Promise<ApiResult<PagedResult<Product>>> => apiGetPaged<Product>('/products/', params),

  getById: (id: number): Promise<ApiResult<Product | null>> =>
    apiGet<Product | null>(`/products/${id}`),

  create: (product: ProductInput): Promise<ApiResult<Product>> =>
    apiPost<Product>('/products/', product),

  update: (id: number, product: ProductInput): Promise<ApiResult<Product>> =>
    apiPut<Product>(`/products/${id}`, product),

  delete: (id: number): Promise<ApiResult<null>> => apiDelete<null>(`/products/${id}`),

  adjustStock: (productId: number, quantityChange: number): Promise<ApiResult<unknown>> =>
    apiPost<unknown>(`/products/${productId}/adjust-stock`, { quantityChange }),

  /**
   * Backend returns a paginated list when filtering by barcode.
   * Extract the first matching product or null.
   */
  findByBarcode: async (barcode: string): Promise<ApiResult<Product | null>> => {
    const result = await apiGetPaged<Product>('/products/', { barcode, limit: 1 });
    if (!result.ok) return result as ApiResult<Product | null>;
    return { ok: true, data: result.data.items[0] ?? null };
  },

  getPurchaseHistory: (
    productId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<PagedResult<ProductPurchaseHistoryItem>>> =>
    apiGetPaged<ProductPurchaseHistoryItem>(`/products/${productId}/purchase-history`, params),

  getSalesHistory: (
    productId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<PagedResult<ProductSalesHistoryItem>>> =>
    apiGetPaged<ProductSalesHistoryItem>(`/products/${productId}/sales-history`, params),

  getUnits: (productId: number): Promise<ApiResult<ProductUnit[]>> =>
    apiGet<ProductUnit[]>(`/products/${productId}/units`),

  createUnit: (data: ProductUnitInput): Promise<ApiResult<ProductUnit>> =>
    apiPost<ProductUnit>(`/products/${data.productId}/units`, data),

  updateUnit: (id: number, data: Partial<ProductUnitInput>): Promise<ApiResult<ProductUnit>> =>
    apiPut<ProductUnit>(`/products/units/${id}`, data),

  deleteUnit: (id: number): Promise<ApiResult<null>> => apiDelete<null>(`/products/units/${id}`),

  setDefaultUnit: (productId: number, unitId: number): Promise<ApiResult<null>> =>
    apiPost<null>(`/products/${productId}/units/${unitId}/set-default`),

  getBatches: (productId: number): Promise<ApiResult<ProductBatch[]>> =>
    apiGet<ProductBatch[]>(`/products/${productId}/batches`),

  createBatch: (data: ProductBatchInput): Promise<ApiResult<ProductBatch>> =>
    apiPost<ProductBatch>(`/products/${data.productId}/batches`, data),
};
