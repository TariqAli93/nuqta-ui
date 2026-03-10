/**
 * Backup API endpoints.
 *
 * Replaces: ipc/backupClient.ts
 *
 * TODO: Backup may remain a desktop-only feature.
 * These endpoints are not in the current backend API spec.
 * Paths are inferred and marked as TODO.
 */
import type { ApiResult } from '../contracts';
import { apiGet, apiPost, apiDelete } from '../http';

export interface BackupInfo {
  name: string;
  sizeBytes: number;
  createdAt: string;
  path: string;
}

export interface BackupStats {
  totalBackups: number;
  totalSizeBytes: number;
  latestBackup: BackupInfo | null;
  oldestBackup: BackupInfo | null;
  backupPath: string;
}

export const backupClient = {
  /** TODO: Backend endpoint needed */
  create: (): Promise<ApiResult<{ backupPath: string; backupName: string; timestamp: number }>> =>
    apiPost<{ backupPath: string; backupName: string; timestamp: number }>('/backup'),

  /** TODO: Backend endpoint needed */
  list: (): Promise<ApiResult<BackupInfo[]>> =>
    apiGet<BackupInfo[]>('/backup'),

  /** TODO: Backend endpoint needed */
  generateToken: (backupName: string): Promise<ApiResult<{ token: string; expiresAt: number }>> =>
    apiPost<{ token: string; expiresAt: number }>('/backup/generate-token', { backupName }),

  /** TODO: Backend endpoint needed */
  restore: (token: string): Promise<ApiResult<{ message: string }>> =>
    apiPost<{ message: string }>('/backup/restore', { token }),

  /** TODO: Backend endpoint needed */
  delete: (backupName: string): Promise<ApiResult<{ message: string }>> =>
    apiDelete<{ message: string }>(`/backup/${encodeURIComponent(backupName)}`),

  /** TODO: Backend endpoint needed */
  getStats: (): Promise<ApiResult<{ stats: BackupStats }>> =>
    apiGet<{ stats: BackupStats }>('/backup/stats'),
};
