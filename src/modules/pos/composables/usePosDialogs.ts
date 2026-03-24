/**
 * usePosDialogs — all dialog open/close and action handlers.
 *
 * Depends on: PosUiState, cart composable, held-sales composable, and focusFn.
 * Contains NO API calls and NO template logic.
 */
import { useCustomersStore } from '@/stores/customersStore';
import type { usePosCart } from '@/composables/usePosCart';
import type { usePosHeldSales } from './usePosHeldSales';
import type { PosUiState } from '../types/pos.types';

type Cart = ReturnType<typeof usePosCart>;
type HeldSales = ReturnType<typeof usePosHeldSales>;

export function usePosDialogs(ui: PosUiState, cart: Cart, held: HeldSales, focusFn: () => void) {
  const customersStore = useCustomersStore();

  // ─── Cart ────────────────────────────────────────────────────────────────

  function openClearConfirmDialog(): void {
    if (cart.cartItems.value.length === 0) return;
    ui.showClearConfirm = true;
  }

  function confirmClear(): void {
    ui.showClearConfirm = false;
    cart.resetCart();
    focusFn();
  }

  function handleDecreaseQuantity(index: number): void {
    const result = cart.decreaseQuantity(index);
    if (result === 'confirm-needed') {
      ui.pendingRemoveIndex = index;
      ui.showRemoveConfirm = true;
    }
  }

  function removeFromCart(index: number): void {
    const result = cart.removeFromCart(index);
    if (result === 'confirm-needed') {
      ui.pendingRemoveIndex = index;
      ui.showRemoveConfirm = true;
    }
  }

  function confirmRemove(): void {
    if (ui.pendingRemoveIndex !== null) {
      cart.confirmRemoveAt(ui.pendingRemoveIndex);
    }
    ui.showRemoveConfirm = false;
    ui.pendingRemoveIndex = null;
  }

  function cancelRemove(): void {
    ui.showRemoveConfirm = false;
    ui.pendingRemoveIndex = null;
  }

  // ─── Customer ────────────────────────────────────────────────────────────

  function openCustomerDialog(): void {
    ui.customerSearch = '';
    ui.showCustomerDialog = true;
    if (customersStore.items.length === 0) {
      void customersStore.fetchCustomers();
    }
  }

  function selectCustomer(customerId: number): void {
    cart.selectedCustomerId.value = customerId;
    ui.showCustomerDialog = false;
  }

  function clearCustomer(): void {
    cart.selectedCustomerId.value = null;
    ui.showCustomerDialog = false;
  }

  // ─── Discount ────────────────────────────────────────────────────────────

  function openDiscountDialog(): void {
    ui.discountInput = cart.discount.value;
    ui.showDiscountDialog = true;
  }

  function applyDiscount(): void {
    cart.applyDiscount(ui.discountInput);
    ui.showDiscountDialog = false;
  }

  // ─── Note ────────────────────────────────────────────────────────────────

  function openNoteDialog(): void {
    ui.noteInput = cart.saleNote.value || '';
    ui.showNoteDialog = true;
  }

  function saveNote(): void {
    cart.saleNote.value = ui.noteInput.trim() || null;
    ui.showNoteDialog = false;
  }

  function clearNote(): void {
    ui.noteInput = '';
    cart.saleNote.value = null;
  }

  // ─── More / Reset ─────────────────────────────────────────────────────────

  function openMoreDialog(): void {
    ui.showMoreDialog = true;
  }

  function openResumeDialog(): void {
    ui.showResumeDialog = true;
    ui.showMoreDialog = false;
  }

  function resetSale(): void {
    if (cart.cartItems.value.length > 0) {
      ui.showResetConfirm = true;
    } else {
      cart.resetCart();
      ui.showMoreDialog = false;
      focusFn();
    }
  }

  function confirmReset(): void {
    ui.showResetConfirm = false;
    cart.resetCart();
    ui.showMoreDialog = false;
    focusFn();
  }

  return {
    openClearConfirmDialog,
    confirmClear,
    handleDecreaseQuantity,
    removeFromCart,
    confirmRemove,
    cancelRemove,
    openCustomerDialog,
    selectCustomer,
    clearCustomer,
    openDiscountDialog,
    applyDiscount,
    openNoteDialog,
    saveNote,
    clearNote,
    openMoreDialog,
    openResumeDialog,
    resetSale,
    confirmReset,
  };
}
