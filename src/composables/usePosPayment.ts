/**
 * POS Payment composable — handles payment processing and after-pay actions.
 *
 * Extracted from PosView to reduce component complexity.
 */
import { ref } from 'vue';
import { useSalesStore } from '@/stores/salesStore';
import { useProductsStore } from '@/stores/productsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAccountingStore } from '@/stores/accountingStore';
import { posClient, postingClient, accountingClient } from '@/api';
import { mapErrorToArabic, t } from '@/i18n/t';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { notifyError, notifySuccess } from '@/utils/notify';
import type { SaleCreateInput, SaleItem, PaymentMethod } from '@/types/domain';

export interface PaymentOverlayPayload {
  paid: number;
  paymentType: SaleCreateInput['paymentType'];
  discount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
}

export function usePosPayment() {
  const isProcessingPayment = ref(false);
  const payOpen = ref(false);

  const salesStore = useSalesStore();
  const productsStore = useProductsStore();
  const settingsStore = useSettingsStore();
  const accountingStore = useAccountingStore();

  async function autoPostSaleEntry(saleId: number, journalEntryId?: number) {
    try {
      let entryId = journalEntryId;
      if (!entryId) {
        const entries = await accountingClient.getJournalEntries({
          sourceType: 'sale',
          sourceId: saleId,
          limit: 1,
        });
        if (entries.ok && entries.data?.items?.length) {
          entryId = entries.data.items[0].id;
        }
      }
      if (entryId) {
        await postingClient.postIndividualEntry(entryId);
      }
    } catch {
      // Auto-posting is best-effort; don't block the POS flow
    }
  }

  async function triggerAfterPay(saleId: number, journalEntryId?: number) {
    if (!accountingStore.settingsLoaded) {
      await accountingStore.fetchAccountingSettings();
    }
    if (accountingStore.settings.autoPostOnSale) {
      void autoPostSaleEntry(saleId, journalEntryId);
    }

    void (async () => {
      try {
        const result = await posClient.afterPay({
          saleId,
          printerName: settingsStore.selectedPrinter || undefined,
        });
        if (!result.ok) {
          notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
        }
      } catch {
        notifyError(t('errors.unexpected'));
      }
    })();
  }

  async function processPayment(
    overlayPayload: PaymentOverlayPayload,
    cartItems: SaleItem[],
    subtotalValue: number,
    discountValue: number,
    taxValue: number,
    currency: string,
    selectedCustomerId: number | null,
    saleNote: string | null
  ): Promise<{ ok: boolean; saleId?: number }> {
    if (cartItems.length === 0 || isProcessingPayment.value) {
      return { ok: false };
    }

    const appliedDiscount = Math.min(
      Math.max(overlayPayload.discount ?? discountValue, 0),
      subtotalValue
    );
    const payableTotal = Math.max(0, subtotalValue - appliedDiscount + taxValue);
    const paidAmount = Math.max(overlayPayload.paid, 0);

    if (payableTotal <= 0) {
      notifyError('إجمالي المستحق يجب أن يكون أكبر من صفر');
      return { ok: false };
    }

    if (paidAmount < payableTotal) {
      notifyError('المبلغ المدفوع أقل من إجمالي المستحق');
      return { ok: false };
    }

    isProcessingPayment.value = true;

    try {
      const payload: SaleCreateInput = {
        customerId: selectedCustomerId ?? undefined,
        discount: appliedDiscount,
        tax: taxValue,
        paymentType: overlayPayload.paymentType || 'cash',
        paidAmount,
        currency,
        notes: saleNote ?? undefined,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          unitName: item.unitName,
          unitFactor: item.unitFactor,
          batchId: item.batchId,
        })),
        interestRate: 0,
        paymentMethod: overlayPayload.paymentMethod as PaymentMethod | undefined,
        referenceNumber: overlayPayload.referenceNumber,
        idempotencyKey: generateIdempotencyKey('sale'),
      };

      const result = await salesStore.createSale(payload);

      if (result.ok) {
        const saleData = result.ok && 'data' in result ? result.data : null;
        // notifySuccess(t('pos.saleCompleted'));
        void productsStore.fetchProducts();
        if (saleData?.id) {
          void triggerAfterPay(saleData.id, saleData.journalEntryId);
        }
        return { ok: true, saleId: saleData?.id };
      } else if (!result.ok && 'error' in result) {
        notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
      }
      return { ok: false };
    } catch {
      notifyError(t('errors.unexpected'));
      return { ok: false };
    } finally {
      isProcessingPayment.value = false;
    }
  }

  return {
    isProcessingPayment,
    payOpen,
    processPayment,
  };
}
