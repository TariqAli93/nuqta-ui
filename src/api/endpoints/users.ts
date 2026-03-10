/**
 * Users API endpoints.
 *
 * Replaces: ipc/usersClient.ts
 */
import type { ApiResult } from '../contracts';
import type { UserInput, UserPublic } from '../../types/domain';
import { apiGet, apiPost, apiPut } from '../http';

export const usersClient = {
  getAll: (params?: Record<string, unknown>): Promise<ApiResult<UserPublic[]>> =>
    apiGet<UserPublic[]>('/users/', params),

  create: (payload: UserInput & { password: string }): Promise<ApiResult<UserPublic>> =>
    apiPost<UserPublic>('/users/', payload),

  update: (id: number, payload: Partial<UserInput>): Promise<ApiResult<UserPublic>> =>
    apiPut<UserPublic>(`/users/${id}`, payload),
};
