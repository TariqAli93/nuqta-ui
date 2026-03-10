/**
 * Barcode API endpoints.
 *
 * Replaces: ipc/barcodeClient.ts
 *
 * TODO: These endpoints are not in the current backend API spec.
 * Paths are inferred and marked as TODO.
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { BarcodeTemplate, BarcodePrintJob } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost, apiDelete } from '../http';

export type BarcodeTemplateInput = Pick<
  BarcodeTemplate,
  | 'name'
  | 'width'
  | 'height'
  | 'barcodeType'
  | 'showPrice'
  | 'showName'
  | 'showBarcode'
  | 'showExpiry'
  | 'isDefault'
> & {
  layoutJson?: string | null;
};

export interface PrintJobInput {
  templateId: number;
  productId: number;
  productName: string;
  barcode?: string;
  price?: number;
  expiryDate?: string;
  quantity: number;
}

export const barcodeClient = {
  /** TODO: Backend endpoint needed */
  getTemplates: (): Promise<ApiResult<BarcodeTemplate[]>> =>
    apiGet<BarcodeTemplate[]>('/barcode/templates'),

  /** TODO: Backend endpoint needed */
  createTemplate: (data: BarcodeTemplateInput): Promise<ApiResult<BarcodeTemplate>> =>
    apiPost<BarcodeTemplate>('/barcode/templates', data),

  /** TODO: Backend endpoint needed */
  getPrintJobs: (params?: {
    productId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<BarcodePrintJob>>> =>
    apiGetPaged<BarcodePrintJob>('/barcode/print-jobs', params),

  /** TODO: Backend endpoint needed */
  createPrintJob: (data: PrintJobInput): Promise<ApiResult<BarcodePrintJob>> =>
    apiPost<BarcodePrintJob>('/barcode/print-jobs', data),

  /** TODO: Backend endpoint needed */
  deleteTemplate: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/barcode/templates/${id}`),
};
