/**
 * Audit API endpoints.
 *
 * Backend provides a single flexible endpoint:
 *   GET /audit/trail  — query filters: entityType, entityId, userId, action, dateFrom, dateTo, limit, offset
 *   POST /audit/cleanup — body: { olderThanDays: number }
 *
 * All former separate routes (user-actions, by-date, by-action, statistics)
 * are served via GET /audit/trail with appropriate filter params.
 */
import type { ApiResult, PagedResult } from '../contracts';
import { apiGetPaged, apiPost } from '../http';

export interface AuditEvent {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  userId?: number;
  changedFields?: Record<string, { old: unknown; new: unknown }> | null;
  changeDescription?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

export interface AuditTrailParams {
  entityType?: string;
  entityId?: number;
  userId?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const auditClient = {
  /** GET /audit/trail with flexible filters */
  getTrail: (params?: AuditTrailParams): Promise<ApiResult<PagedResult<AuditEvent>>> =>
    apiGetPaged<AuditEvent>('/audit/trail', params),

  getByEntity: (
    entityType: string,
    entityId: number,
    limit = 50
  ): Promise<ApiResult<PagedResult<AuditEvent>>> =>
    apiGetPaged<AuditEvent>('/audit/trail', { entityType, entityId, limit }),

  getByUser: (
    userId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<PagedResult<AuditEvent>>> =>
    apiGetPaged<AuditEvent>('/audit/trail', { userId, ...(params ?? {}) }),

  getByDateRange: (
    dateFrom: string,
    dateTo: string,
    limit = 50
  ): Promise<ApiResult<PagedResult<AuditEvent>>> =>
    apiGetPaged<AuditEvent>('/audit/trail', { dateFrom, dateTo, limit }),

  getByAction: (action: string, limit = 50): Promise<ApiResult<PagedResult<AuditEvent>>> =>
    apiGetPaged<AuditEvent>('/audit/trail', { action, limit }),

  /** POST /audit/cleanup — returns { deletedCount: number } */
  cleanup: (olderThanDays: number): Promise<ApiResult<{ deletedCount: number }>> =>
    apiPost<{ deletedCount: number }>('/audit/cleanup', { olderThanDays }),
};
