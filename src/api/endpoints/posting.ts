/**
 * Posting API endpoints.
 *
 * Replaces: ipc/postingClient.ts
 */
import type { ApiResult } from '../contracts';
import { apiGet, apiPost } from '../http';

export interface PostingBatch {
  id: number;
  periodType: 'day' | 'month' | 'year';
  periodStart: string;
  periodEnd: string;
  entriesCount: number;
  totalAmount: number;
  status: 'draft' | 'posted' | 'locked';
  postedAt: string;
  postedBy?: number;
  notes?: string;
  createdAt?: string;
}

interface PostPeriodInput {
  periodType: 'day' | 'month' | 'year';
  periodStart: string;
  periodEnd: string;
  notes?: string;
}

interface ReverseBatchResult {
  batchId: number;
  reversedCount: number;
  entries: any[];
}

export const postingClient = {
  postIndividualEntry: (entryId: number): Promise<ApiResult<any>> =>
    apiPost<any>(`/posting/entries/${entryId}/post`),

  unpostIndividualEntry: (entryId: number): Promise<ApiResult<any>> =>
    apiPost<any>(`/posting/entries/${entryId}/unpost`),

  postPeriod: (data: PostPeriodInput): Promise<ApiResult<PostingBatch>> =>
    apiPost<PostingBatch>('/posting/period', data),

  /** TODO: Backend endpoint not in current spec — add when available */
  getBatches: (params?: {
    periodType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<{ items: PostingBatch[]; total: number }>> =>
    apiGet<{ items: PostingBatch[]; total: number }>('/posting/batches', params),

  reverseEntry: (entryId: number): Promise<ApiResult<any>> =>
    apiPost<any>(`/posting/entries/${entryId}/reverse`),

  /** TODO: Backend endpoint not in current spec — add when available */
  reverseBatch: (batchId: number): Promise<ApiResult<ReverseBatchResult>> =>
    apiPost<ReverseBatchResult>(`/posting/batches/${batchId}/reverse`),

  lockBatch: (batchId: number): Promise<ApiResult<{ batchId: number; status: string }>> =>
    apiPost<{ batchId: number; status: string }>(`/posting/batches/${batchId}/lock`),

  unlockBatch: (batchId: number): Promise<ApiResult<{ batchId: number; status: string }>> =>
    apiPost<{ batchId: number; status: string }>(`/posting/batches/${batchId}/unlock`),

  isBatchLocked: (batchId: number): Promise<ApiResult<{ locked: boolean }>> =>
    apiGet<{ locked: boolean }>(`/posting/batches/${batchId}/locked`),
};
