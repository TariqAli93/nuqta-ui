/**
 * usePosCheckout — payment submission, stock-error handling, and receipt printing.
 *
 * Orchestrates posCheckoutService and posReceiptService.
 * Does NOT own cart state — reads it via the cart composable.
 */
import { useAuthStore } from '@/stores/authStore';
import { useCustomersStore } from '@/stores/customersStore';
import { useProductsStore } from '@/stores/productsStore';
import { useSalesStore } from '@/stores/salesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePosSettingsStore, useSystemSettingsStore } from '@/stores/settings';
import { useCurrency } from '@/composables/useCurrency';
import type { usePosCart } from '@/composables/usePosCart';
import type { usePosPaymentFlow } from '@/composables/usePosPaymentFlow';
import { mapErrorToArabic, t } from '@/i18n/t';
import { notifyError } from '@/utils/notify';
import type { SaleCreateInput } from '@/types/domain';
import { buildSalePayload, validatePayment } from '../services/posCheckoutService';
import { buildAndPrintReceipt, fetchReceiptTextFromServer } from '../services/posReceiptService';
import { extractUnavailableProducts } from '../services/posStockService';
import type { PaymentOverlayPayload, PosUiState } from '../types/pos.types';

type Cart = ReturnType<typeof usePosCart>;
type PaymentFlow = ReturnType<typeof usePosPaymentFlow>;

export function usePosCheckout(
  cart: Cart,
  paymentFlow: PaymentFlow,
  ui: PosUiState,
  focusFn: () => void
) {
  const salesStore = useSalesStore();
  const productsStore = useProductsStore();
  const customersStore = useCustomersStore();
  const authStore = useAuthStore();
  const settingsStore = useSettingsStore();
  const systemSettingsStore = useSystemSettingsStore();
  const posSettingsStore = usePosSettingsStore();
  const { currency } = useCurrency();

  async function handlePaymentConfirm(overlayPayload: PaymentOverlayPayload): Promise<void> {
    if (cart.cartItems.value.length === 0) return;

    const appliedDiscount = overlayPayload.discount ?? cart.discount.value;
    const validation = validatePayment(
      cart.subtotal.value,
      appliedDiscount,
      cart.tax.value,
      overlayPayload.paid,
      overlayPayload.paymentType
    );

    if (!validation.valid) {
      notifyError(validation.error!);
      return;
    }

    if (overlayPayload.paymentType === 'credit' && cart.selectedCustomerId.value === null) {
      notifyError('يجب اختيار زبون قبل إتمام البيع الآجل');
      return;
    }

    if (!paymentFlow.beginProcessing()) return;

    let success = false;

    try {
      const payload = buildSalePayload({
        cartItems: cart.cartItems.value,
        subtotal: cart.subtotal.value,
        discount: appliedDiscount,
        tax: cart.tax.value,
        currency: overlayPayload.currency ?? currency.value,
        customerId: cart.selectedCustomerId.value,
        saleNote: cart.saleNote.value,
        paidAmount: overlayPayload.paid,
        paymentType: overlayPayload.paymentType,
        paymentMethod: overlayPayload.paymentMethod,
        referenceNumber: overlayPayload.referenceNumber,
      });

      const result = await salesStore.createSale(payload as unknown as SaleCreateInput);

      if (result.ok) {
        const saleData = 'data' in result ? result.data : null;
        const selectedCustomerId = cart.selectedCustomerId.value;
        const saleForReceipt = {
          ...payload,
          id: saleData?.id,
          createdAt: saleData?.createdAt ?? new Date().toISOString(),
          invoiceNumber: saleData?.invoiceNumber || payload.invoiceNumber,
          customerId: saleData?.customerId ?? payload.customerId,
          subtotal: saleData?.subtotal ?? payload.subtotal,
          discount: saleData?.discount ?? payload.discount,
          tax: saleData?.tax ?? payload.tax,
          total: saleData?.total ?? payload.total,
          currency: saleData?.currency ?? payload.currency,
          notes: saleData?.notes ?? payload.notes,
          items:
            Array.isArray(saleData?.items) && saleData.items.length > 0
              ? saleData.items
              : payload.items,
        };

        cart.resetCart();
        success = true;
        focusFn();
        void productsStore.fetchProducts();
        void printReceipt(saleData?.id, saleForReceipt, selectedCustomerId);
      } else if ('error' in result) {
        if (result.error.code === 'INSUFFICIENT_STOCK') {
          ui.stockAlertMessage = t('errors.outOfStockMessage');
          ui.stockAlertProducts = extractUnavailableProducts(
            result.error.details,
            cart.cartItems.value.map((i) => i.productName).filter((n): n is string => Boolean(n))
          );
          ui.showStockAlert = true;
        } else {
          notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
        }
      }
    } catch {
      notifyError(t('errors.unexpected'));
    } finally {
      paymentFlow.endProcessing(success);
    }
  }

  async function printReceipt(
    saleId: number | undefined,
    sale: Record<string, unknown>,
    selectedCustomerId: number | null
  ): Promise<void> {
    await Promise.allSettled([
      settingsStore.fetchCompanySettings(),
      systemSettingsStore.fetch(),
      posSettingsStore.fetch(),
    ]);

    const customerName = selectedCustomerId
      ? customersStore.items.find((c) => c.id === selectedCustomerId)?.name
      : undefined;

    const cashierName = authStore.currentUser?.fullName || authStore.currentUser?.username || '';

    let fallbackText: string | undefined;
    if (saleId) {
      fallbackText = await fetchReceiptTextFromServer(
        saleId,
        settingsStore.selectedPrinter || undefined
      );
    }

    buildAndPrintReceipt({
      sale: sale as any,
      customerName,
      cashierName,
      companySettings: settingsStore.companySettings,
      systemSettings: systemSettingsStore.data,
      posSettings: posSettingsStore.data,
      fallbackText,
    });
  }

  return { handlePaymentConfirm };
}
