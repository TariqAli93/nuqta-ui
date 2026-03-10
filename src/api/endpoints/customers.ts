/**
 * Customers API endpoints.
 *
 * Replaces: ipc/customersClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { Customer, CustomerInput } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost, apiPut, apiDelete } from '../http';

export const customersClient = {
  getAll: (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Customer>>> => apiGetPaged<Customer>('/customers/', params),

  getById: (id: number): Promise<ApiResult<Customer | null>> =>
    apiGet<Customer | null>(`/customers/${id}`),

  create: (customer: CustomerInput): Promise<ApiResult<Customer>> =>
    apiPost<Customer>('/customers/', customer),

  update: (id: number, customer: CustomerInput): Promise<ApiResult<Customer>> =>
    apiPut<Customer>(`/customers/${id}`, customer),

  delete: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/customers/${id}`),
};
