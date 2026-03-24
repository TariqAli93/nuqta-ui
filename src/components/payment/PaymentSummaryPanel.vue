<template>
  <v-sheet rounded="lg" border class="pa-4 h-100">
    <div class="grid grid-rows-[auto_1fr] gap-4 payment-summary-panel h-full">
      <div class="payment-summary-panel__content">
        <div class="text-subtitle-1 font-weight-bold mb-3">ملخص الفاتورة</div>

        <div class="d-flex justify-space-between py-2">
          <span class="text-body-2">المجموع الفرعي</span>
          <span class="text-body-1 font-weight-medium">{{ subtotalText }}</span>
        </div>

        <div class="d-flex justify-space-between py-2">
          <span class="text-body-2">الخصم</span>
          <span class="text-body-1 font-weight-medium">{{ discountText }}</span>
        </div>

        <div class="d-flex justify-space-between py-2 mb-2">
          <span class="text-body-2">المدفوع</span>
          <span class="text-body-1 font-weight-medium">{{ paidText }}</span>
        </div>

        <v-sheet rounded="lg" color="primary" class="pa-3 text-white mb-3">
          <div class="text-caption">الإجمالي المستحق</div>
          <div class="text-h5 font-weight-black">{{ totalText }}</div>
        </v-sheet>

        <v-sheet :class="['pa-3 rounded-lg', settlementClass]" border>
          <div class="text-caption mb-1">{{ settlementLabel }}</div>
          <div class="text-h5 font-weight-black">{{ settlementText }}</div>
        </v-sheet>
      </div>

      <!-- place buttons in bottom of the panel -->
      <div class="payment-summary-panel__buttons">
        <slot name="buttons" />
      </div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  subtotalText: string;
  discountText: string;
  paidText: string;
  totalText: string;
  settlementLabel: string;
  settlementText: string;
  settlementValueClass: string;
}>();

const settlementClass = computed(() => {
  if (props.settlementValueClass.includes('text-success'))
    return 'bg-success-lighten-5 text-success';
  if (props.settlementValueClass.includes('text-error')) return 'bg-error-lighten-5 text-error';
  return 'bg-surface-variant';
});
</script>
<style lang="scss">
.payment-summary-panel {
  .text-body-1 {
    &.font-weight-medium {
      font-weight: 500;
    }
  }

  &__buttons {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    place-self: end;
    width: 100%;
  }
}
</style>
