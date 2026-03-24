/**
 * posReceiptService — receipt assembly and printing helpers.
 * Orchestrates receiptPrint.ts utilities. No Vue refs.
 */
import { posClient } from '@/api';
import { mapErrorToArabic, t } from '@/i18n/t';
import {
  createReceiptPrintData,
  printReceiptModern,
  type ReceiptPrintOptions,
} from '@/modules/pos/receiptPrint';
import { notifyError, notifyWarn } from '@/utils/notify';

export type ReceiptSettings = Pick<
  ReceiptPrintOptions,
  'companySettings' | 'systemSettings' | 'posSettings'
>;

/**
 * Ask the server to trigger its after-pay hook (e.g. server-side printing)
 * and return the raw receipt text if one is returned.
 */
export async function fetchReceiptTextFromServer(
  saleId: number,
  printerName?: string
): Promise<string | undefined> {
  try {
    const result = await posClient.afterPay({ saleId, printerName });

    if (!result.ok) {
      notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
      return undefined;
    }

    const responseData = result.data as Record<string, unknown>;
    const payload = result.data?.data;

    return (
      (typeof responseData.receipt === 'string' ? responseData.receipt : undefined) ??
      (payload &&
      typeof payload === 'object' &&
      typeof (payload as Record<string, unknown>).receipt === 'string'
        ? ((payload as Record<string, unknown>).receipt as string)
        : undefined)
    );
  } catch (error) {
    console.error(error);
    notifyError(t('errors.unexpected'));
    return undefined;
  }
}

/**
 * Build receipt data from a completed sale and print it in the browser.
 */
export function buildAndPrintReceipt(options: ReceiptPrintOptions): void {
  const data = createReceiptPrintData(options);
  const printed = printReceiptModern(data);
  if (!printed) {
    notifyWarn(t('errors.unexpected'));
  }
}
