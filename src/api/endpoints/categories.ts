/**
 * Categories API endpoints.
 *
 * Replaces: ipc/categoriesClient.ts
 */
import type { ApiResult } from '../contracts';
import type { Category, CategoryInput } from '../../types/domain';
import { apiGet, apiPost, apiPut, apiDelete } from '../http';

export const categoriesClient = {
  getAll: (params?: Record<string, unknown>): Promise<ApiResult<Category[]>> =>
    apiGet<Category[]>('/categories/', params),

  create: (payload: CategoryInput): Promise<ApiResult<Category>> =>
    apiPost<Category>('/categories/', payload),

  update: (id: number, payload: Partial<CategoryInput>): Promise<ApiResult<Category>> =>
    apiPut<Category>(`/categories/${id}`, payload),

  delete: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/categories/${id}`),
};
