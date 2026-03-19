/**
 * Barcode templates and print jobs API endpoints.
 */
import type { ApiResult, PagedResult } from '../contracts';
import type {
  BarcodeTemplate,
  BarcodeTemplateInput,
  BarcodePrintJob,
  BarcodePrintJobInput,
} from '../../types/domain';
import { apiGet, apiGetPaged, apiPost, apiDelete } from '../http';

export const barcodeClient = {
  // ── Templates ─────────────────────────────────────────────────────────────

  getTemplates: (): Promise<ApiResult<BarcodeTemplate[]>> =>
    apiGet<BarcodeTemplate[]>('/barcodes/templates'),

  createTemplate: (data: BarcodeTemplateInput): Promise<ApiResult<BarcodeTemplate>> =>
    apiPost<BarcodeTemplate>('/barcodes/templates', data),

  deleteTemplate: (id: number): Promise<ApiResult<{ ok: boolean }>> =>
    apiDelete<{ ok: boolean }>(`/barcodes/templates/${id}`),

  // ── Print Jobs ────────────────────────────────────────────────────────────

  getPrintJobs: (params?: {
    productId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<BarcodePrintJob>>> =>
    apiGetPaged<BarcodePrintJob>('/barcodes/print-jobs', params),

  createPrintJob: (data: BarcodePrintJobInput): Promise<ApiResult<BarcodePrintJob>> =>
    apiPost<BarcodePrintJob>('/barcodes/print-jobs', data),
};
