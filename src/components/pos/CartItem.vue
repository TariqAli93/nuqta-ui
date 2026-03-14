<template>
  <v-list-item min-height="72" class="px-4">
    <v-list-item-title class="text-body-2 font-weight-medium">
      {{ item.productName }}
    </v-list-item-title>
    <v-list-item-subtitle class="text-caption text-medium-emphasis mt-1">
      <template v-if="units.length > 1">
        <UnitSelector
          :current="item.unitName ?? ''"
          :units="units"
          @select="(unit) => emit('unitChange', unit)"
        />
      </template>
      <template v-else-if="isNamedUnit">
        <v-chip size="x-small" variant="tonal" class="ml-1">{{ item.unitName }}</v-chip>
        <span class="mr-1">·</span>
      </template>
      {{ formatPrice(item.unitPrice) }} {{ t('pos.each') }}
    </v-list-item-subtitle>

    <template #append>
      <div class="d-flex align-center ga-2">
        <v-btn icon size="small" variant="text" density="comfortable" @click="emit('decrease')">
          <v-icon size="18">mdi-minus</v-icon>
        </v-btn>

        <span class="bg-surface rounded-md px-3 py-1">{{ item.quantity }}</span>

        <v-btn icon size="small" variant="text" density="comfortable" @click="emit('increase')">
          <v-icon size="18">mdi-plus</v-icon>
        </v-btn>

        <span class="text-body-2 font-weight-bold text-no-wrap" style="max-width: 45px">
          {{ formatPrice(item.unitPrice * item.quantity) }}
        </span>

        <v-btn icon variant="text" density="comfortable" class="mr-4" @click="emit('remove')">
          <v-icon size="18" color="error">mdi-close</v-icon>
        </v-btn>
      </div>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CartLineItem, ProductUnitOption } from '@/types/pos';
import { formatPrice } from '@/utils/format';
import { t } from '@/i18n/t';
import UnitSelector from './UnitSelector.vue';

const props = defineProps<{
  item: CartLineItem;
  units: ProductUnitOption[];
}>();

const emit = defineEmits<{
  increase: [];
  decrease: [];
  remove: [];
  unitChange: [unit: ProductUnitOption];
}>();

const isNamedUnit = computed(
  () => props.item.unitName !== 'pcs' && props.item.unitName !== 'piece'
);
</script>
