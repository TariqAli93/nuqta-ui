<template>
  <div class="pos-layout-container bg-background w-100 h-100 d-flex">
    <PosCart
      :cart-items="cart.cartItems.value"
      :cart-item-units-map="cart.cartItemUnitsMap.value"
      :subtotal="cart.subtotal.value"
      :discount="cart.discount.value"
      :tax="cart.tax.value"
      :total="cart.total.value"
      @increase="cart.increaseQuantity"
      @decrease="dialogs.handleDecreaseQuantity"
      @remove="dialogs.removeFromCart"
      @unit-change="cart.handleUnitChange"
      @pay="handlePay"
      @hold="held.handleHold"
      @discount="dialogs.openDiscountDialog"
      @customer="dialogs.openCustomerDialog"
      @clear="dialogs.openClearConfirmDialog"
      @note="dialogs.openNoteDialog"
      @more="dialogs.openMoreDialog"
    />

    <div
      class="pos-main-content flex-grow-1 d-flex flex-column h-100 overflow-hidden py-4 px-4 py-md-6 px-md-8"
    >
      <div class="pos-header flex-shrink-0">
        <PosSearchBar
          ref="searchBarRef"
          :model-value="search.searchQuery.value"
          @update:model-value="
            search.searchQuery.value = $event;
            search.handleSearch();
          "
          @submit="search.handleSearchOrSelectSubmit"
          @highlight-next="search.highlightNext"
          @highlight-prev="search.highlightPrev"
          @clear="search.clearSearch"
        />

        <PosToolbar
          :categories="search.categories.value"
          :selected-category="search.selectedCategory.value"
          :layout="layoutStore.posLayout"
          @select-category="search.selectCategory"
          @show-shortcuts="ui.showShortcutsHelp = true"
          @update:layout="(v: string) => layoutStore.setPosLayout(v as PosLayoutMode)"
        />
      </div>

      <div class="pos-scroll-area grow custom-scrollbar">
        <PosProductGrid
          :products="search.filteredProducts.value"
          :highlighted-index="search.highlightedProductIndex.value"
          :loading="productsStore.loading"
          :layout="layoutStore.posLayout"
          @add-to-cart="safeAddToCart"
        />
      </div>
    </div>
  </div>

  <PaymentOverlay
    v-model="payment.payOpen.value"
    :total="cart.total.value"
    :subtotal="cart.subtotal.value"
    :discount="cart.discount.value"
    :tax="cart.tax.value"
    :currency="currency"
    :cashier-name="cashierName"
    cashier-title="POS Client"
    :busy="payment.isProcessing.value"
    :has-customer="cart.selectedCustomerId.value !== null"
    @confirmed="
      (p) => checkout.handlePaymentConfirm({ ...p, paymentType: p.paymentType ?? 'cash' })
    "
  />

  <StockAlert
    :show="ui.showStockAlert"
    :message="ui.stockAlertMessage"
    :products="ui.stockAlertProducts"
    :title="t('errors.outOfStock')"
    :show-cancel="false"
    :confirm-text="t('common.close')"
    confirm-color="primary"
    @confirm="ui.showStockAlert = false"
  />

  <PosShortcutsHelp v-model="ui.showShortcutsHelp" :shortcuts="shortcutHelpItems" />
  <PosDialogsHost />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, provide, ref } from 'vue';
import { t } from '@/i18n/t';
import { useAuthStore } from '@/stores/authStore';
import { useCustomersStore } from '@/stores/customersStore';
import { useProductsStore } from '@/stores/productsStore';
import { useLayoutStore } from '@/stores/layout';
import type { PosLayoutMode } from '@/stores/layout';
import { useCurrency } from '@/composables/useCurrency';
import { usePosCart } from '@/composables/usePosCart';
import { usePosFocus } from '@/composables/usePosFocus';
import { usePosPaymentFlow } from '@/composables/usePosPaymentFlow';
import { useGlobalBarcodeScanner } from '@/composables/useGlobalBarcodeScanner';
import type { Product } from '@/types/domain';
import PaymentOverlay from '@/components/pos/PaymentOverlay.vue';
import PosShortcutsHelp from '@/components/pos/PosShortcutsHelp.vue';
import StockAlert from '@/components/StockAlert.vue';
import { POS_CONTEXT_KEY } from '../types/pos.types';
import { usePosState } from '../composables/usePosState';
import { usePosSearch } from '../composables/usePosSearch';
import { usePosHeldSales } from '../composables/usePosHeldSales';
import { usePosDialogs } from '../composables/usePosDialogs';
import { usePosCheckout } from '../composables/usePosCheckout';
import { usePosKeyboard, shortcutHelpItems } from '../composables/usePosKeyboard';
import PosCart from '../components/PosCart.vue';
import PosSearchBar from '../components/PosSearchBar.vue';
import PosToolbar from '../components/PosToolbar.vue';
import PosProductGrid from '../components/PosProductGrid.vue';
import PosDialogsHost from '../components/PosDialogsHost.vue';

const productsStore = useProductsStore();
const customersStore = useCustomersStore();
const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const { currency, formatCurrency: currencyFormatter } = useCurrency();

const cart = usePosCart();
const payment = usePosPaymentFlow();
const { ui, anyDialogOpen } = usePosState(payment.payOpen);

const searchBarRef = ref<{ fieldRef: { $el?: HTMLElement } | null } | null>(null);
const searchInputRef = computed(() => searchBarRef.value?.fieldRef ?? null);
const focus = usePosFocus(searchInputRef, anyDialogOpen);

const pendingZeroPriceProduct = ref<Product | null>(null);

async function safeAddToCart(product: Product): Promise<boolean> {
  const { status } = await cart.addToCart(product);
  if (status === 'zero-price') {
    pendingZeroPriceProduct.value = product;
    ui.showZeroPriceConfirm = true;
    return true;
  }
  if (status === 'success') {
    focus.requestFocus();
    return true;
  }
  return false;
}

const search = usePosSearch(safeAddToCart, focus.requestFocus);
const held = usePosHeldSales(cart, ui, focus.requestFocus);
const dialogs = usePosDialogs(ui, cart, held, focus.requestFocus);
const checkout = usePosCheckout(cart, payment, ui, focus.requestFocus);

const cashierName = computed(() => authStore.currentUser?.username || 'POS Client');
const filteredCustomers = computed(() => {
  const q = ui.customerSearch.toLowerCase();
  if (!q) return customersStore.items;
  return customersStore.items.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)
  );
});

function handlePay(): void {
  if (cart.cartItems.value.length > 0) payment.openPayment();
}

async function confirmZeroPriceAdd(): Promise<void> {
  const product = pendingZeroPriceProduct.value;
  ui.showZeroPriceConfirm = false;
  pendingZeroPriceProduct.value = null;
  if (product) {
    await cart.addToCart(product, true);
    focus.requestFocus();
  }
}

function cancelZeroPriceAdd(): void {
  ui.showZeroPriceConfirm = false;
  pendingZeroPriceProduct.value = null;
  focus.requestFocus();
}

provide(POS_CONTEXT_KEY, {
  ui,
  cartItems: cart.cartItems,
  selectedCustomerId: cart.selectedCustomerId,
  subtotal: cart.subtotal,
  discount: cart.discount,
  filteredCustomers,
  heldSales: held.heldSales,
  heldSaleName: held.heldSaleName,
  formatCurrency: currencyFormatter,
  handlers: {
    confirmClear: dialogs.confirmClear,
    confirmRemove: dialogs.confirmRemove,
    cancelRemove: dialogs.cancelRemove,
    confirmZeroPriceAdd,
    cancelZeroPriceAdd,
    selectCustomer: dialogs.selectCustomer,
    clearCustomer: dialogs.clearCustomer,
    applyDiscount: dialogs.applyDiscount,
    saveNote: dialogs.saveNote,
    clearNote: dialogs.clearNote,
    confirmHold: held.confirmHold,
    resumeHeldSale: held.resumeHeldSale,
    onDeleteHeldSale: held.onDeleteHeldSale,
    confirmDeleteHeld: held.confirmDeleteHeld,
    cancelDeleteHeld: held.cancelDeleteHeld,
    openResumeDialog: dialogs.openResumeDialog,
    resetSale: dialogs.resetSale,
    confirmReset: dialogs.confirmReset,
  },
});

usePosKeyboard({
  ui,
  anyDialogOpen,
  payOpen: payment.payOpen,
  searchQuery: search.searchQuery,
  highlightedProductIndex: search.highlightedProductIndex,
  cartHasItems: computed(() => cart.cartItems.value.length > 0),
  handlePay,
  handleHold: held.handleHold,
  openResumeDialog: dialogs.openResumeDialog,
  openCustomerDialog: dialogs.openCustomerDialog,
  openDiscountDialog: dialogs.openDiscountDialog,
  openClearConfirmDialog: dialogs.openClearConfirmDialog,
  handleSearchOrSelectSubmit: search.handleSearchOrSelectSubmit,
  closePayment: payment.closePayment,
  clearSearch: search.clearSearch,
  blurSearch: focus.blurSearch,
  cancelZeroPriceAdd,
  cancelDeleteHeld: held.cancelDeleteHeld,
});

const scanner = useGlobalBarcodeScanner({
  mode: 'pos',
  onScan: search.handleBarcodeScan,
  minLength: 4,
  maxInterKeyMs: 35,
  idleTimeoutMs: 180,
});

onMounted(async () => {
  held.loadHeldSales();
  await nextTick();
  focus.resolveSearchInput();
  focus.forceFocus();
  await Promise.allSettled([productsStore.fetchProducts(), search.loadCategories()]);
  scanner.start();
});

onUnmounted(() => {
  scanner.stop();
  payment.dispose();
});
</script>
