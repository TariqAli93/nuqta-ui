/**
 * usePosKeyboard — registers all POS keyboard shortcuts and Escape handling.
 *
 * Depends on: ui state, dialog handlers, search handlers, payment state.
 * Does NOT implement business logic — delegates to handler functions.
 */
import { type ComputedRef, type Ref } from 'vue';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { t } from '@/i18n/t';
import type { PosUiState } from '../types/pos.types';

interface KeyboardDeps {
  ui: PosUiState;
  anyDialogOpen: ComputedRef<boolean>;
  payOpen: Ref<boolean>;
  searchQuery: Ref<string>;
  highlightedProductIndex: Ref<number>;
  cartHasItems: ComputedRef<boolean>;
  // Handlers
  handlePay: () => void;
  handleHold: () => void;
  openResumeDialog: () => void;
  openCustomerDialog: () => void;
  openDiscountDialog: () => void;
  openClearConfirmDialog: () => void;
  handleSearchOrSelectSubmit: () => Promise<void>;
  closePayment: () => boolean;
  clearSearch: () => void;
  blurSearch: () => void;
  cancelZeroPriceAdd: () => void;
  cancelDeleteHeld: () => void;
}

export const shortcutHelpItems = [
  { key: 'F1', label: t('pos.shortcutHelp') },
  { key: 'F2', label: t('pos.shortcutHoldSale') },
  { key: 'F3', label: t('pos.resumeSale') },
  { key: 'F4', label: t('pos.customer') },
  { key: 'F5', label: t('pos.shortcutPayment') },
  { key: 'F8', label: t('pos.discount') },
  { key: 'F9', label: t('pos.shortcutClear') },
  { key: 'Esc', label: t('pos.shortcutCancel') },
  { key: 'Enter', label: t('pos.shortcutAddItem') },
  { key: '↑↓', label: t('pos.shortcutNavigate') },
];

export function usePosKeyboard(deps: KeyboardDeps) {
  const { ui, anyDialogOpen, payOpen, searchQuery, highlightedProductIndex, cartHasItems } = deps;

  function handleEscape(): void {
    if (payOpen.value) {
      deps.closePayment();
      return;
    }
    if (ui.showClearConfirm) {
      ui.showClearConfirm = false;
      return;
    }
    if (ui.showRemoveConfirm) {
      ui.showRemoveConfirm = false;
      return;
    }
    if (ui.showCustomerDialog) {
      ui.showCustomerDialog = false;
      return;
    }
    if (ui.showDiscountDialog) {
      ui.showDiscountDialog = false;
      return;
    }
    if (ui.showNoteDialog) {
      ui.showNoteDialog = false;
      return;
    }
    if (ui.showHoldDialog) {
      ui.showHoldDialog = false;
      return;
    }
    if (ui.showResumeDialog) {
      ui.showResumeDialog = false;
      return;
    }
    if (ui.showMoreDialog) {
      ui.showMoreDialog = false;
      return;
    }
    if (ui.showShortcutsHelp) {
      ui.showShortcutsHelp = false;
      return;
    }
    if (ui.showZeroPriceConfirm) {
      deps.cancelZeroPriceAdd();
      return;
    }
    if (ui.showDeleteHeldConfirm) {
      deps.cancelDeleteHeld();
      return;
    }
    if (ui.showResetConfirm) {
      ui.showResetConfirm = false;
      return;
    }
    if (searchQuery.value) {
      deps.clearSearch();
      return;
    }
    deps.blurSearch();
  }

  useKeyboardShortcuts([
    {
      key: 'F1',
      label: t('pos.shortcutHelp'),
      handler: () => {
        ui.showShortcutsHelp = true;
      },
    },
    {
      key: 'F2',
      label: t('pos.shortcutHoldSale'),
      handler: () => {
        if (!anyDialogOpen.value) deps.handleHold();
      },
    },
    {
      key: 'F3',
      label: t('pos.resumeSale'),
      handler: () => {
        if (!anyDialogOpen.value) deps.openResumeDialog();
      },
    },
    {
      key: 'F4',
      label: t('pos.customer'),
      handler: () => {
        if (!anyDialogOpen.value) deps.openCustomerDialog();
      },
    },
    {
      key: 'F5',
      label: t('pos.shortcutPayment'),
      handler: () => {
        if (!anyDialogOpen.value && cartHasItems.value) deps.handlePay();
      },
    },
    {
      key: 'F8',
      label: t('pos.discount'),
      handler: () => {
        if (!anyDialogOpen.value) deps.openDiscountDialog();
      },
    },
    {
      key: 'F9',
      label: t('pos.shortcutClear'),
      handler: () => {
        if (!anyDialogOpen.value && cartHasItems.value) deps.openClearConfirmDialog();
      },
    },
    { key: 'Escape', label: t('pos.shortcutCancel'), handler: handleEscape },
    {
      key: 'Enter',
      label: t('pos.shortcutAddItem'),
      preventDefault: false,
      handler: () => {
        if (anyDialogOpen.value) return;
        if (highlightedProductIndex.value >= 0 || searchQuery.value.trim()) {
          void deps.handleSearchOrSelectSubmit();
        }
      },
    },
  ]);
}
