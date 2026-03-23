<template>
  <v-list-item min-height="52" class="px-2 py-1 pos-cart-item">
    <div class="d-flex align-center w-100 ga-1">
      <!-- Product info: name + unit price -->
      <div class="flex-grow-1 overflow-hidden" style="min-width: 0">
        <div class="text-body-2 font-weight-medium text-truncate">{{ item.productName }}</div>
        <div class="text-caption text-medium-emphasis d-flex align-center ga-1 flex-wrap">
          <template v-if="units.length > 1">
            <UnitSelector
              :current="item.unitName ?? ''"
              :units="units"
              @select="(unit) => emit('unitChange', unit)"
            />
          </template>
          <v-chip v-else-if="isNamedUnit" size="x-small" variant="tonal">{{ item.unitName }}</v-chip>
          <span>{{ formatPrice(item.unitPrice) }}</span>
          <span v-if="hasUnitFactor" class="text-disabled">
            {{ item.quantity }}×{{ item.unitFactor }}={{ item.quantityBase }}
          </span>
        </div>
      </div>

      <!-- Quantity controls: inline, fast -->
      <div class="d-flex align-center ga-0 flex-shrink-0">
        <v-btn icon size="x-small" variant="tonal" density="compact" @click="emit('decrease')">
          <v-icon size="16">mdi-minus</v-icon>
        </v-btn>

        <span class="text-body-2 font-weight-bold text-center" style="min-width: 28px">{{ item.quantity }}</span>

        <v-btn icon size="x-small" variant="tonal" density="compact" @click="emit('increase')">
          <v-icon size="16">mdi-plus</v-icon>
        </v-btn>
      </div>

      <!-- Line total -->
      <span class="text-body-2 font-weight-bold text-no-wrap text-end flex-shrink-0" style="min-width: 52px">
        {{ formatPrice(item.subtotal) }}
      </span>

      <!-- Remove -->
      <v-btn icon size="x-small" variant="text" density="compact" @click="emit('remove')">
        <v-icon size="16" color="error">mdi-close</v-icon>
      </v-btn>
    </div>
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

const hasUnitFactor = computed(() => (props.item.unitFactor ?? 1) > 1);
</script>
