<template>
  <v-sheet rounded="lg" border class="pa-4">
    <div class="text-subtitle-1 font-weight-bold">إدخال المبلغ</div>
    <div class="text-body-2 text-medium-emphasis mt-1">{{ selectedMethodLabel }}</div>

    <v-text-field
      :model-value="amountInput"
      variant="outlined"
      density="comfortable"
      label="المبلغ المدفوع"
      hide-details
      class="mt-4 payment-amount-field"
      inputmode="decimal"
      autocomplete="off"
      @update:model-value="$emit('update:amountInput', $event)"
      @focus="$emit('focusField', 'amount')"
      @blur="$emit('blurField', 'amount')"
    >
      <template #prepend-inner>
        <span class="text-body-2 text-medium-emphasis">{{ currency }}</span>
      </template>

      <template #append-inner>
        <v-btn icon variant="text" size="small" :disabled="busy" @click="$emit('clearAmount')">
          <v-icon size="18">mdi-delete-outline</v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <v-expand-transition>
      <v-text-field
        v-if="selectedPaymentMethod === 'card'"
        :model-value="referenceNumber"
        label="رقم المرجع"
        variant="outlined"
        density="comfortable"
        hide-details
        class="mt-3"
        prepend-inner-icon="mdi-credit-card-outline"
        autocomplete="off"
        @update:model-value="$emit('update:referenceNumber', $event)"
        @focus="$emit('focusField', 'reference')"
        @blur="$emit('blurField', 'reference')"
      />
    </v-expand-transition>

    <v-expand-transition>
      <div
        v-if="selectedPaymentMethod === 'credit' && !hasCustomer"
        class="mt-3 text-warning text-caption"
      >
        يجب ربط زبون لاستخدام الدفع الآجل
      </div>
    </v-expand-transition>
  </v-sheet>
</template>

<script setup lang="ts">
import type { PaymentMethod } from '@/types/domain';

defineProps<{
  amountInput: string;
  currency: string;
  selectedMethodLabel: string;
  selectedPaymentMethod: PaymentMethod;
  referenceNumber: string;
  hasCustomer: boolean;
  busy: boolean;
}>();

defineEmits<{
  'update:amountInput': [value: string];
  'update:referenceNumber': [value: string];
  focusField: [field: 'amount' | 'reference'];
  blurField: [field: 'amount' | 'reference'];
  clearAmount: [];
}>();
</script>

<style scoped>
.payment-amount-field :deep(input) {
  font-size: 2rem;
  font-weight: 700;
  text-align: end;
}
</style>
