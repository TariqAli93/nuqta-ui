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
  }): Promise<ApiResult<PagedResult<Product>>> => apiGetPaged<Product>('/products/', params),

  getById: (id: number): Promise<ApiResult<Product | null>> =>
    apiGet<Product | null>(`/products/${id}`),

  create: (product: ProductInput): Promise<ApiResult<Product>> =>
    apiPost<Product>('/products/', product),

  update: (id: number, product: ProductInput): Promise<ApiResult<Product>> =>
    apiPut<Product>(`/products/${id}`, product),

  delete: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/products/${id}`),

  adjustStock: (productId: number, quantityChange: number): Promise<ApiResult<{ ok: true }>> =>
    apiPost<{ ok: true }>(`/products/${productId}/adjust-stock`, { quantityChange }),

  findByBarcode: (barcode: string): Promise<ApiResult<Product | null>> =>
    apiGet<Product | null>('/products/', { barcode }),

  /** TODO: Backend endpoint not in current spec — add when available */
  getPurchaseHistory: (
    productId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<PagedResult<ProductPurchaseHistoryItem>>> =>
    apiGetPaged<ProductPurchaseHistoryItem>(`/products/${productId}/purchase-history`, params),

  /** TODO: Backend endpoint not in current spec — add when available */
  getSalesHistory: (
    productId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<PagedResult<ProductSalesHistoryItem>>> =>
    apiGetPaged<ProductSalesHistoryItem>(`/products/${productId}/sales-history`, params),

  /** TODO: Backend endpoint not in current spec — add when available */
  getUnits: (productId: number): Promise<ApiResult<ProductUnit[]>> =>
    apiGet<ProductUnit[]>(`/products/${productId}/units`),

  /** TODO: Backend endpoint not in current spec — add when available */
  createUnit: (data: ProductUnitInput): Promise<ApiResult<ProductUnit>> =>
    apiPost<ProductUnit>(`/products/${data.productId}/units`, data),

  /** TODO: Backend endpoint not in current spec — add when available */
  updateUnit: (id: number, data: Partial<ProductUnitInput>): Promise<ApiResult<ProductUnit>> =>
    apiPut<ProductUnit>(`/products/units/${id}`, data),

  /** TODO: Backend endpoint not in current spec — add when available */
  deleteUnit: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/products/units/${id}`),

  /** TODO: Backend endpoint not in current spec — add when available */
  setDefaultUnit: (productId: number, unitId: number): Promise<ApiResult<{ ok: true }>> =>
    apiPost<{ ok: true }>(`/products/${productId}/units/${unitId}/set-default`),

  /** TODO: Backend endpoint not in current spec — add when available */
  getBatches: (productId: number): Promise<ApiResult<ProductBatch[]>> =>
    apiGet<ProductBatch[]>(`/products/${productId}/batches`),

  /** TODO: Backend endpoint not in current spec — add when available */
  createBatch: (data: ProductBatchInput): Promise<ApiResult<ProductBatch>> =>
    apiPost<ProductBatch>(`/products/${data.productId}/batches`, data),
};
