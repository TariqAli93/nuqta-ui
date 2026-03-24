/**
 * usePosState — centralised reactive UI state for the POS module.
 *
 * Owns all dialog visibility flags, form inputs, pending confirmation values,
 * and stock-alert state. Also derives `anyDialogOpen` from `payOpen`.
 */
import { computed, reactive, type Ref } from 'vue';
import type { PosUiState } from '../types/pos.types';

export function usePosState(payOpen: Ref<boolean>) {
  const ui = reactive<PosUiState>({
    // Dialog visibility
    showClearConfirm: false,
    showRemoveConfirm: false,
    showCustomerDialog: false,
    showDiscountDialog: false,
    showNoteDialog: false,
    showHoldDialog: false,
    showResumeDialog: false,
    showMoreDialog: false,
    showShortcutsHelp: false,
    showZeroPriceConfirm: false,
    showDeleteHeldConfirm: false,
    showResetConfirm: false,
    // Pending confirmation state
    pendingRemoveIndex: null,
    pendingZeroPriceProductName: null,
    pendingDeleteHeldIndex: null,
    // Dialog form inputs
    customerSearch: '',
    discountInput: 0,
    noteInput: '',
    holdName: '',
    // Stock alert
    showStockAlert: false,
    stockAlertMessage: '',
    stockAlertProducts: [],
  });

  /** True whenever any overlay or dialog is open. Used by keyboard handlers. */
  const anyDialogOpen = computed(
    () =>
      payOpen.value ||
      ui.showClearConfirm ||
      ui.showRemoveConfirm ||
      ui.showCustomerDialog ||
      ui.showDiscountDialog ||
      ui.showNoteDialog ||
      ui.showHoldDialog ||
      ui.showResumeDialog ||
      ui.showMoreDialog ||
      ui.showShortcutsHelp ||
      ui.showZeroPriceConfirm ||
      ui.showDeleteHeldConfirm ||
      ui.showResetConfirm
  );

  return { ui, anyDialogOpen };
}
