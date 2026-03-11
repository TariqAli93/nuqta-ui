/**
 * Reports API endpoints — CSV/JSON export for sales and inventory.
 */
import { http, getAccessToken } from '@/api/http';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export interface ReportParams {
  format?: 'csv' | 'json';
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Download a sales report as CSV or JSON.
 */
export async function downloadSalesReport(params?: ReportParams): Promise<Blob> {
  const url = new URL(`${BASE_URL}/reports/sales`);
  if (params?.format) url.searchParams.set('format', params.format);
  if (params?.dateFrom) url.searchParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) url.searchParams.set('dateTo', params.dateTo);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Report download failed: ${response.status}`);
  }

  return response.blob();
}

/**
 * Download an inventory report as CSV or JSON.
 */
export async function downloadInventoryReport(params?: { format?: 'csv' | 'json' }): Promise<Blob> {
  const url = new URL(`${BASE_URL}/reports/inventory`);
  if (params?.format) url.searchParams.set('format', params.format);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Report download failed: ${response.status}`);
  }

  return response.blob();
}
