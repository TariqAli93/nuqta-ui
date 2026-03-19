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
    apiGet<BarcodeTemplate[]>('/barcode/templates'),

  createTemplate: (data: BarcodeTemplateInput): Promise<ApiResult<BarcodeTemplate>> =>
    apiPost<BarcodeTemplate>('/barcode/templates', data),

  deleteTemplate: (id: number): Promise<ApiResult<{ ok: boolean }>> =>
    apiDelete<{ ok: boolean }>(`/barcode/templates/${id}`),

  // ── Print Jobs ────────────────────────────────────────────────────────────

  getPrintJobs: (params?: {
    productId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<BarcodePrintJob>>> =>
    apiGetPaged<BarcodePrintJob>('/barcode/print-jobs', params),

  createPrintJob: (data: BarcodePrintJobInput): Promise<ApiResult<BarcodePrintJob>> =>
    apiPost<BarcodePrintJob>('/barcode/print-jobs', data),
};
