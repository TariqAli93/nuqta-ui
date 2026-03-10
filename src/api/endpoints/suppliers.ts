/**
 * Suppliers API endpoints.
 *
 * Replaces: ipc/suppliersClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Supplier } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost, apiPut, apiDelete } from '../http';

export type SupplierInput = Pick<
  Supplier,
  'name' | 'phone' | 'phone2' | 'address' | 'city' | 'notes'
>;

export const suppliersClient = {
  getAll: (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Supplier>>> => apiGetPaged<Supplier>('/suppliers/', params),

  getById: (id: number): Promise<ApiResult<Supplier | null>> =>
    apiGet<Supplier | null>(`/suppliers/${id}`),

  create: (supplier: SupplierInput): Promise<ApiResult<Supplier>> =>
    apiPost<Supplier>('/suppliers/', supplier),

  update: (id: number, supplier: SupplierInput): Promise<ApiResult<Supplier>> =>
    apiPut<Supplier>(`/suppliers/${id}`, supplier),

  delete: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/suppliers/${id}`),
};
