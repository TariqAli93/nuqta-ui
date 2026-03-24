import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { Customer, PaymentMethod, SaleItem } from '@/types/domain';
import type { HeldSale } from '@/composables/usePosHeldSales';

// ─── Domain payload exported by PaymentOverlay ───────────────────────────────

export interface PaymentOverlayPayload {
  paid: number;
  paymentType: 'cash' | 'credit' | 'mixed';
  currency?: string | 'IQD';
  discount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
}

// ─── Centralised UI state (owned by usePosState) ─────────────────────────────

export interface PosUiState {
  // Dialog visibility flags
  showClearConfirm: boolean;
  showRemoveConfirm: boolean;
  showCustomerDialog: boolean;
  showDiscountDialog: boolean;
  showNoteDialog: boolean;
  showHoldDialog: boolean;
  showResumeDialog: boolean;
  showMoreDialog: boolean;
  showShortcutsHelp: boolean;
  showZeroPriceConfirm: boolean;
  showDeleteHeldConfirm: boolean;
  showResetConfirm: boolean;
  // Confirmation-dialog pending values
  pendingRemoveIndex: number | null;
  pendingZeroPriceProductName: string | null;
  pendingDeleteHeldIndex: number | null;
  // Form inputs for dialogs
  customerSearch: string;
  discountInput: number;
  noteInput: string;
  holdName: string;
  // Stock alert
  showStockAlert: boolean;
  stockAlertMessage: string;
  stockAlertProducts: string[];
}

// ─── Action-handler surface exposed to PosDialogsHost ────────────────────────

export interface PosDialogHandlers {
  // Cart confirmation
  confirmClear: () => void;
  confirmRemove: () => void;
  cancelRemove: () => void;
  // Zero-price
  confirmZeroPriceAdd: () => Promise<void>;
  cancelZeroPriceAdd: () => void;
  // Customer
  selectCustomer: (id: number) => void;
  clearCustomer: () => void;
  // Discount
  applyDiscount: () => void;
  // Note
  saveNote: () => void;
  clearNote: () => void;
  // Hold
  confirmHold: () => void;
  // Resume
  resumeHeldSale: (index: number) => void;
  onDeleteHeldSale: (index: number) => void;
  confirmDeleteHeld: () => void;
  cancelDeleteHeld: () => void;
  // More options
  openResumeDialog: () => void;
  resetSale: () => void;
  confirmReset: () => void;
}

// ─── Full context provided by PosView and injected by PosDialogsHost ─────────

export interface PosContext {
  ui: PosUiState;
  cartItems: Ref<SaleItem[]>;
  selectedCustomerId: Ref<number | null>;
  subtotal: ComputedRef<number>;
  discount: Ref<number>;
  filteredCustomers: ComputedRef<Customer[]>;
  heldSales: Ref<HeldSale[]>;
  heldSaleName: (sale: HeldSale, index: number) => string;
  formatCurrency: (value: number) => string;
  handlers: PosDialogHandlers;
}

export const POS_CONTEXT_KEY: InjectionKey<PosContext> = Symbol('pos-context');
