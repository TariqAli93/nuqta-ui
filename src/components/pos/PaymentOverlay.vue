<template>
  <v-dialog
    :model-value="props.modelValue"
    max-width="100vw"
    scrollable
    persistent
    transition="dialog-bottom-transition"
    scrim="background"
    :opacity="0.95"
    @update:model-value="updateModelValue"
  >
    <v-card rounded="xl" class="payment-dialog-shell h-100">
      <v-card-text class="pa-5 pa-md-6">
        <PaymentDialogHeader :cashier-name="cashierNameText" @close="closeOverlay" />

        <v-row class="mt-4" dense>
          <v-col cols="12" md="4">
            <PaymentSummaryPanel
              :subtotal-text="formatCurrency(settlement.subtotalValue.value)"
              :discount-text="formatCurrency(settlement.appliedDiscount.value)"
              :paid-text="formatCurrency(settlement.paidAmount.value)"
              :total-text="formatCurrency(settlement.effectiveTotal.value)"
              :settlement-label="settlement.settlementLabel.value"
              :settlement-text="formatCurrency(settlement.settlementValue.value)"
              :settlement-value-class="settlement.settlementValueClass.value"
            >
              <template #buttons>
                <PaymentDialogFooter
                  :can-confirm="settlement.canConfirm.value"
                  :busy="props.busy"
                  @close="closeOverlay"
                  @confirm="confirmPayment"
                />
              </template>
            </PaymentSummaryPanel>
          </v-col>

          <v-col cols="12" md="8">
            <div class="d-flex flex-column ga-3 h-full">
              <PaymentAmountField
                :amount-input="entry.amountInput.value"
                :currency="props.currency"
                :selected-method-label="entry.selectedMethodLabel.value"
                :selected-payment-method="entry.selectedPaymentMethod.value"
                :reference-number="entry.referenceNumber.value"
                :has-customer="props.hasCustomer"
                :busy="props.busy"
                @update:amount-input="entry.onAmountInput"
                @update:reference-number="(v) => (entry.referenceNumber.value = v)"
                @focus-field="entry.setActiveField"
                @blur-field="entry.clearActiveField"
                @clear-amount="entry.clearAmount"
              />

              <PaymentMethodSelector
                :model-value="entry.selectedPaymentMethod.value"
                :options="entry.paymentMethodOptions"
                :busy="props.busy"
                @update:model-value="onPaymentMethodChange"
              />

              <PaymentDiscountEditor
                :model-value="entry.discountEditorOpen.value"
                :discount-input="entry.extraDiscountInput.value"
                :busy="props.busy"
                @toggle="entry.toggleDiscountEditor"
                @update:discount-input="entry.onExtraDiscountInput"
                @focus-field="() => entry.setActiveField('discount')"
                @blur-field="() => entry.clearActiveField('discount')"
              />

              <v-sheet rounded="lg" border class="pa-3 d-flex flex-wrap ga-2 justify-end">
                <v-btn variant="outlined" :disabled="props.busy" @click="fillExactAmount">
                  تسوية المبلغ
                </v-btn>
                <v-btn
                  variant="outlined"
                  :disabled="props.busy"
                  @click="entry.toggleDiscountEditor"
                >
                  {{ entry.discountEditorOpen.value ? 'إخفاء الخصم' : 'خصم إضافي' }}
                </v-btn>
              </v-sheet>

              <PaymentKeypad
                :keys="entry.keypadKeys"
                :denominations="[5000, 10000, 25000, 50000]"
                :busy="props.busy"
                @press="entry.handleKeypadPress"
                @denomination="entry.fillExact"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { PaymentMethod, SaleInput } from '@/types/domain';
import type { ConfirmedPaymentPayload, PaymentDialogProps } from '@/types/payment.types';
import { buildPaymentPayload } from '@/services/paymentPayloadBuilder';
import { usePaymentEntry } from '@/composables/payment/usePaymentEntry';
import { usePaymentKeyboard } from '@/composables/payment/usePaymentKeyboard';
import { usePaymentSettlement } from '@/composables/payment/usePaymentSettlement';
import PaymentDialogHeader from '@/components/payment/PaymentDialogHeader.vue';
import PaymentSummaryPanel from '@/components/payment/PaymentSummaryPanel.vue';
import PaymentAmountField from '@/components/payment/PaymentAmountField.vue';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector.vue';
import PaymentDiscountEditor from '@/components/payment/PaymentDiscountEditor.vue';
import PaymentKeypad from '@/components/payment/PaymentKeypad.vue';
import PaymentDialogFooter from '@/components/payment/PaymentDialogFooter.vue';

const props = withDefaults(defineProps<PaymentDialogProps>(), {
  subtotal: undefined,
  discount: 0,
  tax: 0,
  currency: 'IQD',
  cashierName: '',
  cashierTitle: 'POS Client',
  busy: false,
  allowPartial: false,
  hasCustomer: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirmed: [payload: ConfirmedPaymentPayload];
}>();

const busy = computed(() => props.busy);
const hasCustomer = computed(() => props.hasCustomer);

const entry = usePaymentEntry({ busy, hasCustomer });

const settlement = usePaymentSettlement({
  total: computed(() => props.total),
  subtotal: computed(() => props.subtotal),
  discount: computed(() => props.discount),
  tax: computed(() => props.tax),
  amountInput: entry.amountInput,
  extraDiscountInput: entry.extraDiscountInput,
  selectedPaymentMethod: entry.selectedPaymentMethod,
  referenceNumber: entry.referenceNumber,
  busy,
  allowPartial: computed(() => props.allowPartial),
  hasCustomer,
});

const selectedPaymentType = computed<SaleInput['paymentType']>(() =>
  entry.selectedPaymentMethod.value === 'credit' ? 'credit' : 'cash'
);

const cashierNameText = computed(() => props.cashierName?.trim() || 'POS Client');

function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: props.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    }).format(value);
  } catch {
    return new Intl.NumberFormat('ar-IQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    }).format(Number.isInteger(value) ? value : 0);
  }
}

function closeOverlay() {
  emit('update:modelValue', false);
}

function updateModelValue(value: boolean) {
  if (!value) {
    closeOverlay();
    return;
  }
  emit('update:modelValue', true);
}

function fillExactAmount() {
  entry.fillExact(settlement.effectiveTotal.value);
}

function onPaymentMethodChange(value: PaymentMethod | null) {
  if (!value) return;
  entry.selectedPaymentMethod.value = value;
  if (value === 'credit') {
    entry.clearAmount();
  }
}

function confirmPayment() {
  if (!settlement.canConfirm.value) return;

  const payload = buildPaymentPayload({
    paid: settlement.paidAmount.value,
    paymentType: selectedPaymentType.value,
    paymentMethod: entry.selectedPaymentMethod.value,
    appliedDiscount: settlement.appliedDiscount.value,
    baseDiscount: settlement.baseDiscount.value,
    referenceNumber: entry.referenceNumber.value,
    currency: props.currency,
  });

  console.log('Confirming payment with payload:', payload);

  emit('confirmed', payload);
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return;
    entry.resetEntry(settlement.effectiveTotal.value);
  }
);

usePaymentKeyboard({
  isOpen: computed(() => props.modelValue),
  canConfirm: settlement.canConfirm,
  pressKey: entry.handleKeypadPress,
  clearActiveValue: entry.clearActiveValue,
  confirm: confirmPayment,
  close: closeOverlay,
});
</script>

<style scoped>
.payment-dialog-shell {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-surface)),
    rgb(var(--v-theme-surface-bright))
  );
}
</style>
