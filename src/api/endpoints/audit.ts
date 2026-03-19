/**
 * Audit API endpoints.
 *
 * Replaces: ipc/auditClient.ts
 *
 * TODO: These endpoints are not in the current backend API spec.
 * Paths are inferred from the IPC channel names and may need adjustment.
 */
import type { ApiResult } from '../contracts';
import { apiGet, apiPost } from '../http';

export interface AuditEvent {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  userId?: number;
  changedFields?: Record<string, { old: unknown; new: unknown }>;
  changeDescription?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface AuditStatistics {
  totalEvents: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byUser?: Record<string, number>;
}

export const auditClient = {
  getTrail: (
    entityType: string,
    entityId: number,
    limit?: number
  ): Promise<ApiResult<AuditEvent[]>> =>
    apiGet<AuditEvent[]>('/audit/trail', { entityType, entityId, limit: limit ?? 50 }),

  getUserActions: (
    userId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResult<AuditEvent[]>> =>
    apiGet<AuditEvent[]>('/audit/user-actions', { userId, ...(params ?? {}) }),

  getByDateRange: (
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<ApiResult<AuditEvent[]>> =>
    apiGet<AuditEvent[]>('/audit/by-date', { startDate, endDate, limit }),

  getByAction: (action: string, limit?: number): Promise<ApiResult<AuditEvent[]>> =>
    apiGet<AuditEvent[]>('/audit/by-action', { action, limit }),

  getStatistics: (params?: {
    startDate?: string;
    endDate?: string;
    userId?: number;
  }): Promise<ApiResult<AuditStatistics>> =>
    apiGet<AuditStatistics>('/audit/statistics', params ?? {}),

  cleanup: (olderThanDays: number): Promise<ApiResult<{ deletedCount: number; message: string }>> =>
    apiPost<{ deletedCount: number; message: string }>('/audit/cleanup', { olderThanDays }),
};
