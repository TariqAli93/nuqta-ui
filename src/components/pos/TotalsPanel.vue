<template>
  <v-sheet class="px-0 py-1">
    <!-- Summary lines: compact -->
    <div class="d-flex justify-space-between align-center px-1 py-1">
      <span class="text-caption text-medium-emphasis">{{ t('sales.subtotal') }}</span>
      <span class="text-caption font-weight-medium text-no-wrap">{{ formatPrice(subtotal) }}</span>
    </div>

    <div v-if="discount > 0" class="d-flex justify-space-between align-center px-1 py-1">
      <span class="text-caption text-medium-emphasis">{{ t('sales.discount') }}</span>
      <span class="text-caption font-weight-medium text-no-wrap text-error">-{{ formatPrice(discount) }}</span>
    </div>

    <div v-if="tax > 0" class="d-flex justify-space-between align-center px-1 py-1">
      <span class="text-caption text-medium-emphasis">{{ t('sales.tax') }}</span>
      <span class="text-caption font-weight-medium text-no-wrap">{{ formatPrice(tax) }}</span>
    </div>

    <!-- TOTAL: dominant visual element -->
    <v-sheet
      color="primary"
      rounded="lg"
      class="pos-total-block d-flex justify-space-between align-center px-4 py-3 mt-2"
    >
      <span class="text-subtitle-1 font-weight-bold text-on-primary">{{ t('common.total') }}</span>
      <span class="pos-total-amount text-on-primary font-weight-black text-no-wrap">
        {{ formatPrice(total) }}
      </span>
    </v-sheet>
  </v-sheet>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import { formatPrice } from '@/utils/format';

interface Props {
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
}

withDefaults(defineProps<Props>(), {
  discount: 0,
  tax: 0,
});
</script>

<style scoped>
.pos-total-amount {
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pos-total-block {
  min-height: 56px;
}
</style>
