<template>
  <v-list-item class="cart-item-clean px-4 py-3">
    <div class="cart-item-layout">
      <!-- Left section -->
      <div class="cart-item-main">
        <div class="cart-item-header">
          <div class="cart-item-title text-body-2 font-weight-bold">
            {{ item.productName }}
          </div>

          <v-btn
            icon
            variant="text"
            size="small"
            density="comfortable"
            color="error"
            class="cart-remove-btn"
            @click="emit('remove')"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="cart-item-meta text-caption text-medium-emphasis">
          <template v-if="units.length > 1">
            <UnitSelector
              :current="item.unitName ?? ''"
              :units="units"
              @select="(unit) => emit('unitChange', unit)"
            />
          </template>

          <template v-else-if="isNamedUnit">
            <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-medium">
              {{ item.unitName }}
            </v-chip>
          </template>

          <span class="unit-price font-weight-medium">
            {{ formatPrice(item.unitPrice) }}
          </span>

          <span v-if="hasUnitFactor" class="factor-note">
            {{ item.quantity }} × {{ item.unitFactor }} = {{ item.quantityBase }}
          </span>
        </div>
      </div>

      <!-- Right section -->
      <div class="cart-item-side">
        <div class="cart-item-subtotal text-body-1 font-weight-black text-primary">
          {{ formatPrice(item.subtotal) }}
        </div>

        <v-sheet class="qty-control" color="surface-variant" elevation="0">
          <v-btn
            icon
            variant="text"
            size="small"
            density="compact"
            class="qty-btn"
            @click="emit('decrease')"
          >
            <v-icon size="14">mdi-minus</v-icon>
          </v-btn>

          <span class="qty-value text-caption font-weight-bold">
            {{ item.quantity }}
          </span>

          <v-btn
            icon
            variant="text"
            size="small"
            density="compact"
            class="qty-btn"
            @click="emit('increase')"
          >
            <v-icon size="14">mdi-plus</v-icon>
          </v-btn>
        </v-sheet>
      </div>
    </div>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CartLineItem, ProductUnitOption } from '@/types/pos';
import { formatPrice } from '@/utils/format';
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

<style scoped>
.cart-item-clean {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.cart-item-clean:hover {
  background: rgba(var(--v-theme-surface-variant), 0.22);
}

.cart-item-layout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cart-item-main {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-item-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.cart-item-title {
  min-width: 0;
  flex: 1;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-remove-btn {
  flex-shrink: 0;
  margin-top: -2px;
}

.cart-item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  line-height: 1.4;
}

.unit-price {
  white-space: nowrap;
}

.factor-note {
  color: rgba(var(--v-theme-on-surface), 0.5);
  white-space: nowrap;
}

.cart-item-side {
  flex: 0 0 auto;
  min-width: 96px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.cart-item-subtotal {
  line-height: 1;
  white-space: nowrap;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 34px;
  padding: 3px 6px;
}

.qty-btn {
  width: 26px;
  height: 26px;
}

.qty-value {
  min-width: 24px;
  text-align: center;
}

@media (max-width: 600px) {
  .cart-item-layout {
    align-items: flex-start;
    gap: 12px;
  }

  .cart-item-side {
    min-width: 84px;
  }

  .cart-item-subtotal {
    font-size: 0.95rem;
  }
}
</style>
