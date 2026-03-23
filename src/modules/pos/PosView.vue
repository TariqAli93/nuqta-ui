<template>
  <v-container fluid>
    <CartPanel
      :items="cartItems"
      :units-map="cartItemUnitsMap"
      @increase="increaseQuantity"
      @decrease="handleDecreaseQuantity"
      @remove="removeFromCart"
      @unit-change="handleUnitChange"
    >
      <template #totals>
        <TotalsPanel :subtotal="subtotal" :discount="discount" :tax="tax" :total="total" />
      </template>

      <template #actions>
        <PosActionBar
          :can-pay="cartItems.length > 0"
          :can-clear="cartItems.length > 0"
          @pay="handlePay"
          @hold="handleHold"
          @discount="openDiscountDialog"
          @customer="openCustomerDialog"
          @clear="openClearConfirmDialog"
          @note="openNoteDialog"
          @more="openMoreDialog"
        />
      </template>
    </CartPanel>

    <v-app-bar class="mb-5 border-r-0! border-l-0!">
      <v-card-text class="pa-4">
        <v-text-field
          ref="searchField"
          v-model="searchQuery"
          variant="outlined"
          hide-details
          single-line
          density="comfortable"
          clearable
          :placeholder="t('pos.searchPlaceholder')"
          prepend-inner-icon="mdi-barcode-scan"
          @update:model-value="handleSearch"
          @keydown.enter.prevent="handleSearchOrSelectSubmit"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @click:clear="clearSearch"
          :autofocus="false"
        />
      </v-card-text>
    </v-app-bar>

    <div class="d-flex align-center mb-5">
      <CategoryStrip
        :categories="categories"
        :selected-id="selectedCategory"
        @select="selectCategory"
        class="grow"
      />

      <v-btn icon size="small" variant="text" class="mr-2" @click="showShortcutsHelp = true">
        <v-icon>mdi-keyboard-outline</v-icon>
      </v-btn>

      <v-btn-toggle
        :model-value="layoutStore.posLayout"
        @update:model-value="(v: any) => v && layoutStore.setPosLayout(v)"
        density="default"
        class="mr-2 gap-2"
      >
        <v-btn value="grid" icon size="small" variant="text">
          <v-icon>mdi-view-grid</v-icon>
        </v-btn>
        <v-btn value="list" icon size="small" variant="text">
          <v-icon>mdi-view-list</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Grid layout -->
    <v-row v-if="layoutStore.posLayout === 'grid'">
      <template v-if="productsStore.loading">
        <v-col v-for="n in 12" :key="`skeleton-${n}`" cols="6" sm="4" md="3" lg="2" xl="2">
          <v-skeleton-loader type="card" />
        </v-col>
      </template>

      <template v-else-if="filteredProducts.length > 0">
        <v-col
          v-for="(product, pIdx) in filteredProducts"
          :key="product.id"
          cols="6"
          sm="4"
          md="3"
          lg="2"
          xl="2"
        >
          <ProductTile
            :product="product"
            :class="{ 'pos-highlight': pIdx === highlightedProductIndex }"
            @select="handleAddToCart"
          />
        </v-col>
      </template>
    </v-row>

    <!-- List layout -->
    <div v-else>
      <template v-if="productsStore.loading">
        <v-skeleton-loader
          v-for="n in 8"
          :key="`skeleton-list-${n}`"
          type="list-item-two-line"
          class="mb-2"
        />
      </template>

      <template v-else-if="filteredProducts.length > 0">
        <ProductListItem
          v-for="(product, pIdx) in filteredProducts"
          :key="product.id"
          :product="product"
          :class="['mb-2', { 'pos-highlight': pIdx === highlightedProductIndex }]"
          @select="handleAddToCart"
        />
      </template>
    </div>

    <v-sheet
      v-if="filteredProducts.length === 0 && !productsStore.loading"
      color="transparent"
      rounded="0"
      min-height="300"
      class="d-flex flex-column align-center justify-center"
    >
      <v-icon size="56" color="grey-lighten-2">mdi-package-variant-closed</v-icon>
      <div class="text-subtitle-1 text-medium-emphasis mt-4">{{ t('pos.noProducts') }}</div>
      <div class="text-body-2 text-medium-emphasis mt-2 text-center">
        {{ t('pos.noProductsHint') }}
      </div>
    </v-sheet>
  </v-container>

  <PaymentOverlay
    v-model="payOpen"
    :total="total"
    :subtotal="subtotal"
    :discount="discount"
    :tax="tax"
    :currency="currency"
    :cashier-name="cashierName"
    :cashier-title="'POS Client'"
    :busy="isProcessingPayment"
    :has-customer="selectedCustomerId !== null"
    @confirmed="handlePaymentConfirm"
  />

  <v-dialog v-model="showClearConfirm" max-width="420" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.clearCartTitle') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">{{ t('pos.clearCartText') }}</v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="showClearConfirm = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" @click="confirmClear">{{ t('common.clear') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showRemoveConfirm" max-width="420" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.removeItemTitle') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">{{ t('pos.removeItemText') }}</v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="cancelRemove">{{ t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" @click="confirmRemove">{{ t('common.delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showZeroPriceConfirm" max-width="420" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.zeroPriceTitle') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">{{ t('pos.zeroPriceWarning') }}</v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="cancelZeroPriceAdd">{{ t('common.cancel') }}</v-btn>
        <v-btn color="warning" variant="flat" @click="confirmZeroPriceAdd">{{ t('common.confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDeleteHeldConfirm" max-width="420" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.deleteHeldTitle') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">{{ t('pos.confirmDeleteHeldSale') }}</v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="cancelDeleteHeld">{{ t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" @click="confirmDeleteHeld">{{ t('common.delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showResetConfirm" max-width="420" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.resetSaleTitle') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">{{ t('pos.confirmResetSale') }}</v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="showResetConfirm = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" @click="confirmReset">{{ t('common.confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showCustomerDialog" max-width="600" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.selectCustomer') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-text-field
          v-model="customerSearch"
          variant="outlined"
          density="comfortable"
          :placeholder="t('pos.searchCustomers')"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
        />

        <v-list
          v-if="!customersStore.loading && filteredCustomers.length > 0"
          density="comfortable"
          class="mt-4"
        >
          <v-list-item
            v-for="customer in filteredCustomers"
            :key="customer.id"
            :value="customer.id"
            :active="selectedCustomerId === customer.id"
            min-height="56"
            @click="customer.id && selectCustomer(customer.id)"
          >
            <v-list-item-title>{{ customer.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ customer.phone || t('pos.noPhone') }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-sheet v-else-if="customersStore.loading" class="d-flex align-center justify-center py-8">
          <v-progress-circular indeterminate />
        </v-sheet>

        <v-sheet v-else class="text-center py-8 text-medium-emphasis">
          {{ t('pos.noCustomers') }}
        </v-sheet>
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="clearCustomer">{{ t('common.clear') }}</v-btn>
        <v-btn variant="text" @click="showCustomerDialog = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDiscountDialog" max-width="400" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.applyDiscount') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <MoneyInput
          v-model="discountInput"
          :label="t('pos.discountAmount')"
          grid-layout
          autofocus
          @keyup.enter="applyDiscount"
          :max="subtotal"
        />
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="showDiscountDialog = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="applyDiscount">{{ t('common.apply') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showNoteDialog" max-width="500" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.addNote') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-textarea
          v-model="noteInput"
          variant="outlined"
          density="comfortable"
          :label="t('pos.saleNote')"
          rows="3"
          autofocus
        />
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 d-flex align-center ga-2">
        <v-btn variant="text" @click="clearNote">{{ t('common.clear') }}</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="showNoteDialog = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="saveNote">{{ t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showHoldDialog" max-width="400" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.holdSale') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-text-field
          v-model="holdName"
          variant="outlined"
          density="comfortable"
          :label="t('pos.holdName')"
          :placeholder="t('pos.holdNamePlaceholder')"
          autofocus
          @keyup.enter="confirmHold"
        />
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="showHoldDialog = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="confirmHold">{{ t('pos.hold') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showResumeDialog" max-width="500" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.resumeSale') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-list v-if="heldSales.length > 0" density="comfortable">
          <v-list-item
            v-for="(sale, index) in heldSales"
            :key="index"
            min-height="64"
            @click="resumeHeldSale(index)"
          >
            <template #prepend>
              <v-icon>mdi-pause-circle</v-icon>
            </template>
            <v-list-item-title>
              {{ heldSaleName(sale, index) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ sale.items.length }} {{ t('common.items') }} - {{ formatCurrency(sale.total) }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click.stop="onDeleteHeldSale(index)"
              >
                <v-icon size="20">mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        <v-sheet v-else class="text-center py-8 text-medium-emphasis">
          {{ t('pos.noHeldSales') }}
        </v-sheet>
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="showResumeDialog = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showMoreDialog" max-width="400" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.moreOptions') }}</v-card-title>
      <v-list density="comfortable" class="mt-4">
        <v-list-item min-height="64" @click="openResumeDialog">
          <template #prepend>
            <v-icon>mdi-play-circle</v-icon>
          </template>
          <v-list-item-title>{{ t('pos.resumeSale') }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ heldSales.length }} {{ t('pos.heldSalesCount') }}
          </v-list-item-subtitle>
          <template #append>
            <v-hotkey border="0" display-mode="icon" elevation="0" keys="f3" />
          </template>
        </v-list-item>

        <v-list-item min-height="64" @click="resetSale">
          <template #prepend>
            <v-icon>mdi-refresh</v-icon>
          </template>
          <v-list-item-title>{{ t('pos.newSale') }}</v-list-item-title>
          <v-list-item-subtitle>{{ t('pos.startFresh') }}</v-list-item-subtitle>
          <template #append>
            <v-hotkey border="0" display-mode="icon" elevation="0" keys="f1" />
          </template>
        </v-list-item>
      </v-list>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="showMoreDialog = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <StockAlert
    :show="showStockAlert"
    :message="stockAlertMessage"
    :products="stockAlertProducts"
    :title="t('errors.outOfStock')"
    :show-cancel="false"
    :confirm-text="t('common.close')"
    confirm-color="primary"
    @confirm="showStockAlert = false"
  />

  <PosShortcutsHelp v-model="showShortcutsHelp" :shortcuts="shortcutHelpItems" />
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useProductsStore } from '@/stores/productsStore';
import { useSalesStore } from '@/stores/salesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCustomersStore } from '@/stores/customersStore';
import { useAuthStore } from '@/stores/authStore';
import { useCurrency } from '@/composables/useCurrency';
import ProductTile from '@/components/pos/ProductTile.vue';
import ProductListItem from '@/components/pos/ProductListItem.vue';
import CategoryStrip from '@/components/pos/CategoryStrip.vue';
import CartPanel from '@/components/pos/CartPanel.vue';
import TotalsPanel from '@/components/pos/TotalsPanel.vue';
import PosActionBar from '@/components/pos/PosActionBar.vue';
import PaymentOverlay from '@/components/pos/PaymentOverlay.vue';
import StockAlert from '@/components/StockAlert.vue';
import type { Product, SaleItem, SaleInput, Category } from '@/types/domain';
import { categoriesClient, posClient } from '@/api';
import { useGlobalBarcodeScanner } from '@/composables/useGlobalBarcodeScanner';
import MoneyInput from '@/components/shared/MoneyInput.vue';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';
import { useLayoutStore } from '@/stores/layout';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import PosShortcutsHelp from '@/components/pos/PosShortcutsHelp.vue';
import { usePosCart } from '@/composables/usePosCart';
import { usePosHeldSales, type HeldSale } from '@/composables/usePosHeldSales';
import { usePosSettingsStore, useSystemSettingsStore } from '@/stores/settings';
import { createReceiptPrintData, printReceiptModern } from '@/modules/pos/receiptPrint';
import { usePosFocus } from '@/composables/usePosFocus';
import { usePosPaymentFlow } from '@/composables/usePosPaymentFlow';

const productsStore = useProductsStore();
const salesStore = useSalesStore();
const customersStore = useCustomersStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const { currency, formatCurrency: currencyFormatter } = useCurrency();
const layoutStore = useLayoutStore();
const posSettingsStore = usePosSettingsStore();
const systemSettingsStore = useSystemSettingsStore();

type TextFieldRef = {
  focus?: () => void;
  $el?: HTMLElement;
};

const searchField = ref<TextFieldRef | null>(null);
const searchQuery = ref('');
const selectedCategory = ref<number | null>(null);
const dbCategories = ref<Category[]>([]);

const {
  cartItems,
  cartItemUnitsMap,
  discount,
  tax,
  selectedCustomerId,
  saleNote,
  subtotal,
  total,
  addToCart,
  handleUnitChange,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart: removeCartItem,
  confirmRemoveAt,
  resetCart,
  applyDiscount: applyCartDiscount,
  ensureUnitsCached,
  trackProductPrice,
} = usePosCart();

// Payment flow composable — handles overlay state, processing lock, double-submit guard
const {
  payOpen,
  isProcessing: isProcessingPayment,
  openPayment,
  closePayment,
  beginProcessing,
  endProcessing,
  dispose: disposePaymentFlow,
} = usePosPaymentFlow();

const showClearConfirm = ref(false);
const showRemoveConfirm = ref(false);
const showCustomerDialog = ref(false);
const showDiscountDialog = ref(false);
const showNoteDialog = ref(false);
const showHoldDialog = ref(false);
const showResumeDialog = ref(false);
const showMoreDialog = ref(false);
const showStockAlert = ref(false);
const showShortcutsHelp = ref(false);
const showZeroPriceConfirm = ref(false);
const showDeleteHeldConfirm = ref(false);
const showResetConfirm = ref(false);
const stockAlertMessage = ref('');
const stockAlertProducts = ref<string[]>([]);

const pendingRemoveIndex = ref<number | null>(null);
const pendingZeroPriceProduct = ref<Product | null>(null);
const pendingDeleteHeldIndex = ref<number | null>(null);

// Keyboard navigation: highlighted product index in filtered results
const highlightedProductIndex = ref(-1);
const customerSearch = ref('');
const discountInput = ref(0);
const noteInput = ref('');
const holdName = ref('');

type PaymentOverlayPayload = {
  paid: number;
  paymentType: SaleInput['paymentType'];
  discount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
};

const {
  heldSales,
  loadHeldSales,
  holdSale,
  resumeSale: resumeHeldSaleFromStore,
  deleteHeldSale: deleteHeldSaleFromStore,
  heldSaleName,
} = usePosHeldSales();

// Global barcode scanner integration
const scanner = useGlobalBarcodeScanner({
  mode: 'pos',
  onScan: handleBarcodeScan,
  minLength: 4,
  maxInterKeyMs: 35,
  idleTimeoutMs: 180,
});

/**
 * Unified add-to-cart handler. All entry points (barcode, tile click, search submit)
 * go through this single function to prevent behavioral drift.
 *
 * Returns true if the product was added (or zero-price dialog was triggered).
 */
async function safeAddToCart(product: Product, options?: { notify?: boolean }): Promise<boolean> {
  const { status } = await addToCart(product);

  if (status === 'zero-price') {
    pendingZeroPriceProduct.value = product;
    showZeroPriceConfirm.value = true;
    return true; // flow continues via dialog
  }

  if (status === 'success') {
    if (options?.notify !== false) {
      showScanSuccess(product.name);
    }
    focusSearchInput();
    return true;
  }

  return false;
}

// Template-bound handler for ProductTile/ProductListItem @select
async function handleAddToCart(product: Product) {
  await safeAddToCart(product, { notify: false });
}

async function handleBarcodeScan(barcode: string) {
  let product: Product | null | undefined;
  try {
    product = await productsStore.findProductByBarcode(barcode);
  } catch {
    showScanError();
    return;
  }

  if (!product) {
    showScanError();
    return;
  }

  if (!product.isActive) {
    showScanWarning(t('pos.productInactive'));
    return;
  }

  await safeAddToCart(product);
}

async function confirmZeroPriceAdd() {
  const product = pendingZeroPriceProduct.value;
  showZeroPriceConfirm.value = false;
  pendingZeroPriceProduct.value = null;
  if (product) {
    await addToCart(product, true);
    focusSearchInput();
  }
}

function cancelZeroPriceAdd() {
  showZeroPriceConfirm.value = false;
  pendingZeroPriceProduct.value = null;
  focusSearchInput();
}

const categories = computed(() => {
  const allCategories = [{ id: null as number | null, name: t('common.all') }];
  const activeCategories = dbCategories.value
    .filter((c) => c.isActive)
    .map((c) => ({
      id: c.id ?? null,
      name: c.name,
    }));

  return [...allCategories, ...activeCategories];
});

const filteredProducts = computed(() => {
  let products = productsStore.items.filter((p) => p.isActive);

  if (selectedCategory.value !== null) {
    products = products.filter((p) => p.categoryId === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
    );
  }

  return products;
});

const filteredCustomers = computed(() => {
  if (!customerSearch.value.trim()) {
    return customersStore.items;
  }
  const query = customerSearch.value.toLowerCase();
  return customersStore.items.filter(
    (c) => c.name.toLowerCase().includes(query) || c.phone?.toLowerCase().includes(query)
  );
});

const cashierName = computed(() => authStore.currentUser?.username || 'POS Client');

const anyDialogOpen = computed(() => {
  return (
    payOpen.value ||
    showClearConfirm.value ||
    showRemoveConfirm.value ||
    showCustomerDialog.value ||
    showDiscountDialog.value ||
    showNoteDialog.value ||
    showHoldDialog.value ||
    showResumeDialog.value ||
    showMoreDialog.value ||
    showShortcutsHelp.value ||
    showZeroPriceConfirm.value ||
    showDeleteHeldConfirm.value ||
    showResetConfirm.value
  );
});

function formatCurrency(value: number): string {
  return currencyFormatter(value);
}

/**
 * Extract unavailable product names from the INSUFFICIENT_STOCK error details.
 * The backend may return details as:
 *   - an array of objects with a `productName` or `name` field
 *   - an array of strings
 *   - a single object with `productName`/`name`
 * Falls back to all cart product names if nothing useful is found.
 */
function extractUnavailableProducts(details: unknown): string[] {
  if (Array.isArray(details)) {
    const names = details
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d && typeof d === 'object') {
          const obj = d as Record<string, unknown>;
          const name = obj.productName ?? obj.name;
          return typeof name === 'string' ? name : undefined;
        }
        return undefined;
      })
      .filter((n): n is string => !!n);
    if (names.length > 0) return names;
  }

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const obj = details as Record<string, unknown>;
    const name = obj.productName ?? obj.name;
    if (typeof name === 'string') return [name];
  }

  // Fallback: show all cart product names
  return cartItems.value.map((item) => item.productName).filter((n): n is string => !!n);
}

// Stock is managed by the backend via inventory movements.
// Cart operations simply track what the user wants to buy.
// Product stock numbers are refreshed from the DB after each sale.

// Focus management composable — centralizes search input focus restoration
const { resolveSearchInput, requestFocus, forceFocus, blurSearch } = usePosFocus(searchField, anyDialogOpen);

// Backward-compatible alias used throughout the component
const focusSearchInput = requestFocus;

function selectCategory(id: number | null) {
  selectedCategory.value = id;
  highlightedProductIndex.value = -1;
}

function handleSearch() {
  // Reset highlight on every keystroke to avoid stale index pointing past new results
  highlightedProductIndex.value = -1;
}

function clearSearch() {
  searchQuery.value = '';
  highlightedProductIndex.value = -1;
}

function normalizeSearchToken(value: string): string {
  return value.trim().toLowerCase();
}

function findProductByScanToken(scanToken: string): Product | undefined {
  //  focus search input
  focusSearchInput();
  const token = normalizeSearchToken(scanToken);
  return productsStore.items.find((product) => {
    if (!product.isActive) return false;
    const barcode = normalizeSearchToken(product.barcode ?? '');
    const sku = normalizeSearchToken(product.sku ?? '');
    return barcode === token || sku === token;
  });
}

function showScanSuccess(productName: string) {
  notifySuccess(`${t('pos.productAdded')}: ${productName}`);
}

function showScanError() {
  notifyError(`${t('pos.barcodeNotFound')}`);
}

function showScanWarning(message: string) {
  notifyWarn(message);
}

function showPaymentMessage(message: string, color: 'success' | 'error') {
  if (color === 'success') {
    notifySuccess(message);
  } else {
    notifyError(message);
  }
}

async function handleSearchSubmit() {
  const scanToken = normalizeSearchToken(searchQuery.value);
  if (!scanToken || productsStore.loading) return;

  const product = findProductByScanToken(scanToken);

  if (!product) {
    showScanError();
    clearSearch();
    focusSearchInput();
    return;
  }

  await safeAddToCart(product);
  clearSearch();
  focusSearchInput();
}

// Keyboard navigation: arrow keys move highlight, Enter selects highlighted or falls back to search submit
function scrollHighlightedIntoView() {
  if (highlightedProductIndex.value < 0) return;
  void nextTick(() => {
    const el = document.querySelector('.pos-highlight');
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function highlightNext() {
  const max = filteredProducts.value.length - 1;
  if (max < 0) return;
  highlightedProductIndex.value = Math.min(highlightedProductIndex.value + 1, max);
  scrollHighlightedIntoView();
}

function highlightPrev() {
  if (highlightedProductIndex.value <= 0) {
    highlightedProductIndex.value = -1;
    return;
  }
  highlightedProductIndex.value -= 1;
  scrollHighlightedIntoView();
}

async function handleSearchOrSelectSubmit() {
  // If a product is highlighted via arrow keys, select it
  const idx = highlightedProductIndex.value;
  if (idx >= 0 && idx < filteredProducts.value.length) {
    const product = filteredProducts.value[idx];
    if (product) {
      await safeAddToCart(product);
      highlightedProductIndex.value = -1;
      clearSearch();
      return;
    }
  }
  // Reset stale highlight if somehow out of bounds
  if (idx >= filteredProducts.value.length) {
    highlightedProductIndex.value = -1;
  }
  // Otherwise fall back to barcode/SKU exact-match search
  await handleSearchSubmit();
}

function handleDecreaseQuantity(index: number) {
  const result = decreaseQuantity(index);
  if (result === undefined) return;
  if (result === 'confirm-needed') {
    pendingRemoveIndex.value = index;
    showRemoveConfirm.value = true;
  }
}

function removeFromCart(index: number) {
  const result = removeCartItem(index);
  if (result === undefined) return;
  if (result === 'confirm-needed') {
    pendingRemoveIndex.value = index;
    showRemoveConfirm.value = true;
  }
}

function cancelRemove() {
  showRemoveConfirm.value = false;
  pendingRemoveIndex.value = null;
}

function confirmRemove() {
  if (pendingRemoveIndex.value !== null) {
    confirmRemoveAt(pendingRemoveIndex.value);
  }
  showRemoveConfirm.value = false;
  pendingRemoveIndex.value = null;
}

function openClearConfirmDialog() {
  if (cartItems.value.length === 0) return;
  showClearConfirm.value = true;
}

function confirmClear() {
  showClearConfirm.value = false;
  resetSaleData();
  focusSearchInput();
}

function resetSaleData() {
  resetCart();
}

function openCustomerDialog() {
  customerSearch.value = '';
  showCustomerDialog.value = true;
  if (customersStore.items.length === 0) {
    void customersStore.fetchCustomers();
  }
}

function selectCustomer(customerId: number) {
  selectedCustomerId.value = customerId;
  showCustomerDialog.value = false;
}

function clearCustomer() {
  selectedCustomerId.value = null;
  showCustomerDialog.value = false;
}

function openDiscountDialog() {
  discountInput.value = discount.value;
  showDiscountDialog.value = true;
}

function applyDiscount() {
  applyCartDiscount(discountInput.value);
  showDiscountDialog.value = false;
}

function openNoteDialog() {
  noteInput.value = saleNote.value || '';
  showNoteDialog.value = true;
}

function saveNote() {
  saleNote.value = noteInput.value.trim() || null;
  showNoteDialog.value = false;
}

function clearNote() {
  noteInput.value = '';
  saleNote.value = null;
}

function handleHold() {
  if (cartItems.value.length === 0) {
    notifyWarn(t('pos.nothingToHold'));
    return;
  }
  holdName.value = '';
  showHoldDialog.value = true;
}

function confirmHold() {
  holdSale({
    name: holdName.value.trim() || `عملية ${heldSales.value.length + 1}`,
    items: JSON.parse(JSON.stringify(cartItems.value)),
    discount: discount.value,
    tax: tax.value,
    customerId: selectedCustomerId.value,
    note: saleNote.value,
    total: total.value,
    timestamp: Date.now(),
  });

  resetSaleData();

  showHoldDialog.value = false;
  focusSearchInput();
}

function openResumeDialog() {
  showResumeDialog.value = true;
  showMoreDialog.value = false;
}

function resumeHeldSale(index: number) {
  const sale = resumeHeldSaleFromStore(index);
  if (!sale) return;

  // Deep clone all mutable data to prevent shared reference mutations.
  // resumeHeldSaleFromStore already returns a JSON clone, but we clone items
  // again defensively since they become the live cart array.
  const clonedItems: SaleItem[] = JSON.parse(JSON.stringify(sale.items));

  // Restore cart state from the held sale
  cartItems.value = clonedItems;
  discount.value = sale.discount;
  tax.value = sale.tax;
  selectedCustomerId.value = sale.customerId;
  saleNote.value = sale.note;

  // Populate unit caches for resumed items
  for (const item of cartItems.value) {
    trackProductPrice(item.productId);
  }
  void ensureUnitsCached();

  showResumeDialog.value = false;
  focusSearchInput();
}

function onDeleteHeldSale(index: number) {
  pendingDeleteHeldIndex.value = index;
  showDeleteHeldConfirm.value = true;
}

function confirmDeleteHeld() {
  if (pendingDeleteHeldIndex.value !== null) {
    deleteHeldSaleFromStore(pendingDeleteHeldIndex.value);
  }
  showDeleteHeldConfirm.value = false;
  pendingDeleteHeldIndex.value = null;
}

function cancelDeleteHeld() {
  showDeleteHeldConfirm.value = false;
  pendingDeleteHeldIndex.value = null;
}

function openMoreDialog() {
  showMoreDialog.value = true;
}

function resetSale() {
  if (cartItems.value.length > 0) {
    showResetConfirm.value = true;
  } else {
    resetSaleData();
    showMoreDialog.value = false;
    focusSearchInput();
  }
}

function confirmReset() {
  showResetConfirm.value = false;
  resetSaleData();
  showMoreDialog.value = false;
  focusSearchInput();
}

function handlePay() {
  if (cartItems.value.length === 0) return;
  openPayment();
}

async function triggerAfterPay(saleId: number): Promise<string | undefined> {
  let receiptText: string | undefined;

  try {
    const result = await posClient.afterPay({
      saleId,
      printerName: settingsStore.selectedPrinter || undefined,
    });

    if (!result.ok) {
      notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
    } else {
      const responseData = result.data as Record<string, unknown>;
      const payload = result.data?.data;
      const rawReceipt =
        (typeof responseData.receipt === 'string' ? responseData.receipt : undefined) ??
        (payload && typeof payload === 'object' && typeof payload.receipt === 'string'
          ? payload.receipt
          : undefined);

      receiptText = rawReceipt;
    }
  } catch (error) {
    console.error(error);
    notifyError(t('errors.unexpected'));
  }

  return receiptText;
}

async function ensureReceiptSettingsLoaded(): Promise<void> {
  await Promise.allSettled([
    settingsStore.fetchCompanySettings(),
    systemSettingsStore.fetch(),
    posSettingsStore.fetch(),
  ]);
}

function getSelectedCustomerName(): string | undefined {
  if (selectedCustomerId.value === null) return undefined;

  return customersStore.items.find((customer) => customer.id === selectedCustomerId.value)?.name;
}

function buildReceiptPrintModel(
  sale: SaleInput & { id?: number; createdAt?: string; items: SaleItem[] },
  fallbackText?: string
) {
  return createReceiptPrintData({
    sale,
    customerName: getSelectedCustomerName(),
    cashierName:
      authStore.currentUser?.fullName || authStore.currentUser?.username || cashierName.value,
    companySettings: settingsStore.companySettings,
    systemSettings: systemSettingsStore.data,
    posSettings: posSettingsStore.data,
    fallbackText,
  });
}

async function printSaleReceipt(
  saleId: number | undefined,
  sale: SaleInput & { id?: number; createdAt?: string; items: SaleItem[] }
): Promise<void> {
  await ensureReceiptSettingsLoaded();

  let fallbackText: string | undefined;
  if (saleId) {
    fallbackText = await triggerAfterPay(saleId);
  }

  const printed = printReceiptModern(buildReceiptPrintModel(sale, fallbackText));

  if (!printed) {
    notifyWarn(t('errors.unexpected'));
  }
}

async function handlePaymentConfirm(overlayPayload: PaymentOverlayPayload) {
  if (cartItems.value.length === 0) return;

  const appliedDiscount = Math.min(
    Math.max(overlayPayload.discount ?? discount.value, 0),
    subtotal.value
  );
  const payableTotal = Math.max(0, subtotal.value - appliedDiscount + tax.value);
  const paidAmount = Math.max(overlayPayload.paid, 0);

  if (payableTotal <= 0) {
    showPaymentMessage('إجمالي المستحق يجب أن يكون أكبر من صفر', 'error');
    return;
  }

  const strictPaymentRequired = true;
  if (strictPaymentRequired && paidAmount < payableTotal) {
    showPaymentMessage('المبلغ المدفوع أقل من إجمالي المستحق', 'error');
    return;
  }

  // Double-submit guard: beginProcessing returns false if already processing
  if (!beginProcessing()) return;

  let success = false;

  try {
    const invoiceNumber = `فاتورة-${Date.now()}`;

    const itemsWithSubtotals = cartItems.value.map((item) => ({
      ...item,
      subtotal: item.quantity * item.unitPrice - (item.discount || 0),
      quantityBase: item.quantity * (item.unitFactor ?? 1),
    }));

    const remainingAmount = Math.max(payableTotal - paidAmount, 0);

    const payload: SaleInput = {
      invoiceNumber,
      customerId: selectedCustomerId.value,
      subtotal: subtotal.value,
      discount: appliedDiscount,
      tax: tax.value,
      total: payableTotal,
      currency: currency.value,
      exchangeRate: 1,
      interestRate: 0,
      interestAmount: 0,
      paymentType: overlayPayload.paymentType || 'cash',
      paidAmount,
      remainingAmount,
      status: remainingAmount <= 0 ? 'completed' : 'pending',
      notes: saleNote.value,
      items: itemsWithSubtotals,
      paymentMethod: overlayPayload.paymentMethod,
      referenceNumber: overlayPayload.referenceNumber,
      idempotencyKey: generateIdempotencyKey('sale'),
    };

    const result = await salesStore.createSale(payload);

    if (result.ok) {
      const saleData = result.ok && 'data' in result ? result.data : null;
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
            : itemsWithSubtotals,
      };

      resetSaleData();
      success = true;

      focusSearchInput();

      // Refresh product stock from backend
      void productsStore.fetchProducts();

      void printSaleReceipt(saleData?.id, saleForReceipt);
    } else if (!result.ok && 'error' in result) {
      if (result.error.code === 'INSUFFICIENT_STOCK') {
        stockAlertMessage.value = t('errors.outOfStockMessage');

        // Extract out-of-stock product names from error details if available
        const details = result.error.details;
        const unavailableNames = extractUnavailableProducts(details);
        stockAlertProducts.value = unavailableNames;
        showStockAlert.value = true;
      } else {
        notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
      }
    }
  } catch {
    notifyError(t('errors.unexpected'));
  } finally {
    endProcessing(success);
  }
}

function handleEscapeShortcut(): void {
  if (payOpen.value) {
    closePayment();
  } else if (showClearConfirm.value) {
    showClearConfirm.value = false;
  } else if (showRemoveConfirm.value) {
    showRemoveConfirm.value = false;
  } else if (showCustomerDialog.value) {
    showCustomerDialog.value = false;
  } else if (showDiscountDialog.value) {
    showDiscountDialog.value = false;
  } else if (showNoteDialog.value) {
    showNoteDialog.value = false;
  } else if (showHoldDialog.value) {
    showHoldDialog.value = false;
  } else if (showResumeDialog.value) {
    showResumeDialog.value = false;
  } else if (showMoreDialog.value) {
    showMoreDialog.value = false;
  } else if (showShortcutsHelp.value) {
    showShortcutsHelp.value = false;
  } else if (showZeroPriceConfirm.value) {
    cancelZeroPriceAdd();
  } else if (showDeleteHeldConfirm.value) {
    cancelDeleteHeld();
  } else if (showResetConfirm.value) {
    showResetConfirm.value = false;
  } else if (searchQuery.value) {
    clearSearch();
  } else {
    blurSearch();
  }
}

const shortcutHelpItems = [
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

useKeyboardShortcuts([
  {
    key: 'F1',
    label: t('pos.shortcutHelp'),
    handler: () => {
      showShortcutsHelp.value = true;
    },
  },
  {
    key: 'F2',
    label: t('pos.shortcutHoldSale'),
    handler: () => {
      if (anyDialogOpen.value) return;
      handleHold();
    },
  },
  {
    key: 'F3',
    label: t('pos.resumeSale'),
    handler: () => {
      if (anyDialogOpen.value) return;
      openResumeDialog();
    },
  },
  {
    key: 'F4',
    label: t('pos.customer'),
    handler: () => {
      if (anyDialogOpen.value) return;
      openCustomerDialog();
    },
  },
  {
    key: 'F5',
    label: t('pos.shortcutPayment'),
    handler: () => {
      if (anyDialogOpen.value || cartItems.value.length === 0) return;
      handlePay();
    },
  },
  {
    key: 'F8',
    label: t('pos.discount'),
    handler: () => {
      if (anyDialogOpen.value) return;
      openDiscountDialog();
    },
  },
  {
    key: 'F9',
    label: t('pos.shortcutClear'),
    handler: () => {
      if (anyDialogOpen.value || cartItems.value.length === 0) return;
      openClearConfirmDialog();
    },
  },
  {
    key: 'Escape',
    label: t('pos.shortcutCancel'),
    handler: () => {
      handleEscapeShortcut();
    },
  },
  {
    key: 'Enter',
    label: t('pos.shortcutAddItem'),
    preventDefault: false,
    handler: () => {
      if (anyDialogOpen.value) return;
      if (highlightedProductIndex.value >= 0 || searchQuery.value.trim()) {
        void handleSearchOrSelectSubmit();
      }
    },
  },
]);

async function loadCategories() {
  try {
    const result = await categoriesClient.getAll({});
    if (result.ok && result.data) {
      dbCategories.value = Array.isArray(result.data) ? result.data : [];
    }
  } catch {
    // Categories are non-critical — POS works without them
  }
}

onMounted(async () => {
  // Initialize held sales from localStorage (synchronous, fast)
  loadHeldSales();

  // Wait for DOM to fully render, then resolve and focus search input for immediate barcode scanning
  await nextTick();
  resolveSearchInput();
  forceFocus();

  // Load products and categories in parallel for faster startup
  // Use allSettled so a single failure doesn't block the rest
  await Promise.allSettled([
    productsStore.fetchProducts(),
    loadCategories(),
    settingsStore.fetchCompanySettings(),
    systemSettingsStore.fetch(),
    posSettingsStore.fetch(),
  ]);

  // Start global barcode scanner
  scanner.start();
});

onUnmounted(() => {
  scanner.stop();
  disposePaymentFlow();
});
</script>

<style scoped>
.pos-highlight {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 8px;
}
</style>
