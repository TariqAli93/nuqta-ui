/**
 * usePosHeldSales (module-level) — hold/resume/delete logic with cart integration.
 *
 * Wraps the shared usePosHeldSales composable and adds POS-level orchestration:
 * saving the current cart into a held sale and restoring it.
 */
import { usePosHeldSales as usePosHeldSalesCore } from '@/composables/usePosHeldSales';
import { notifyWarn } from '@/utils/notify';
import { t } from '@/i18n/t';
import type { usePosCart } from '@/composables/usePosCart';
import type { PosUiState } from '../types/pos.types';

type Cart = ReturnType<typeof usePosCart>;

export function usePosHeldSales(cart: Cart, ui: PosUiState, focusFn: () => void) {
  const core = usePosHeldSalesCore();

  function handleHold(): void {
    if (cart.cartItems.value.length === 0) {
      notifyWarn(t('pos.nothingToHold'));
      return;
    }
    ui.holdName = '';
    ui.showHoldDialog = true;
  }

  function confirmHold(): void {
    core.holdSale({
      name: ui.holdName.trim() || `عملية ${core.heldSales.value.length + 1}`,
      items: JSON.parse(JSON.stringify(cart.cartItems.value)),
      discount: cart.discount.value,
      tax: cart.tax.value,
      customerId: cart.selectedCustomerId.value,
      note: cart.saleNote.value,
      total: cart.total.value,
      timestamp: Date.now(),
    });

    cart.resetCart();
    ui.showHoldDialog = false;
    focusFn();
  }

  function resumeHeldSale(index: number): void {
    const sale = core.resumeSale(index);
    if (!sale) return;

    cart.cartItems.value = JSON.parse(JSON.stringify(sale.items));
    cart.discount.value = sale.discount;
    cart.tax.value = sale.tax;
    cart.selectedCustomerId.value = sale.customerId;
    cart.saleNote.value = sale.note;

    for (const item of cart.cartItems.value) {
      void cart.trackProductPrice(item.productId);
    }
    void cart.ensureUnitsCached();

    ui.showResumeDialog = false;
    focusFn();
  }

  function onDeleteHeldSale(index: number): void {
    ui.pendingDeleteHeldIndex = index;
    ui.showDeleteHeldConfirm = true;
  }

  function confirmDeleteHeld(): void {
    if (ui.pendingDeleteHeldIndex !== null) {
      core.deleteHeldSale(ui.pendingDeleteHeldIndex);
    }
    ui.showDeleteHeldConfirm = false;
    ui.pendingDeleteHeldIndex = null;
  }

  function cancelDeleteHeld(): void {
    ui.showDeleteHeldConfirm = false;
    ui.pendingDeleteHeldIndex = null;
  }

  return {
    heldSales: core.heldSales,
    heldSaleName: core.heldSaleName,
    loadHeldSales: core.loadHeldSales,
    handleHold,
    confirmHold,
    resumeHeldSale,
    onDeleteHeldSale,
    confirmDeleteHeld,
    cancelDeleteHeld,
  };
}
