<template>
  <v-sheet class="px-2 py-3 bg-transparent">
    <v-list density="compact" bg-color="transparent" class="py-0">
      <v-list-item class="px-2" min-height="28">
        <template #title>
          <span class="text-body-2 text-medium-emphasis font-weight-medium">{{ t('sales.subtotal') }}</span>
        </template>
        <template #append>
          <span class="text-body-2 font-weight-bold text-no-wrap">{{
            formatPrice(subtotal)
          }}</span>
        </template>
      </v-list-item>

      <v-list-item v-if="discount > 0" class="px-2" min-height="28">
        <template #title>
          <span class="text-body-2 text-medium-emphasis font-weight-medium">{{ t('sales.discount') }}</span>
        </template>
        <template #append>
          <span class="text-body-2 font-weight-bold text-error text-no-wrap"
            >-{{ formatPrice(discount) }}</span
          >
        </template>
      </v-list-item>

      <v-list-item v-if="tax > 0" class="px-2" min-height="28">
        <template #title>
          <span class="text-body-2 text-medium-emphasis font-weight-medium">{{ t('sales.tax') }}</span>
        </template>
        <template #append>
          <span class="text-body-2 font-weight-bold text-no-wrap">{{ formatPrice(tax) }}</span>
        </template>
      </v-list-item>
    </v-list>

    <v-divider class="my-3 border-opacity-50"></v-divider>

    <v-list density="compact" bg-color="transparent" class="py-0">
      <v-list-item class="px-2" min-height="48">
        <template #title>
          <span class="text-h6 font-weight-bold text-uppercase tracking-wide">{{ t('common.total') }}</span>
        </template>
        <template #append>
          <span class="text-h4 font-weight-black text-primary text-no-wrap">
            {{ formatPrice(total) }}
          </span>
        </template>
      </v-list-item>
    </v-list>
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
