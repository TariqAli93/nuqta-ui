/**
 * Printers API endpoints.
 *
 * Replaces: ipc/printersClient.ts
 *
 * Printers are a desktop-only feature (requires native access).
 * In web mode, these are stubs returning empty results.
 * In desktop mode, the backend could proxy to a local print service if needed.
 */
import type { ApiResult } from '../contracts';

interface Printer {
  name: string;
  isDefault: boolean;
}

interface PrintOptions {
  receiptHtml: string | unknown;
  printerName: string | unknown;
  cut: 'none' | 'full' | 'partial' | unknown;
  kickPin: number | unknown;
  feedLines: number | unknown;
}

export const printersClient = {
  /** Returns empty list in web mode */
  getAll: (): Promise<ApiResult<Printer[]>> => Promise.resolve({ ok: true as const, data: [] }),

  /** No-op in web mode */
  print: (options: PrintOptions): Promise<ApiResult<{ printed: boolean }>> =>
    Promise.resolve({ ok: true as const, data: { printed: false } }),
};
