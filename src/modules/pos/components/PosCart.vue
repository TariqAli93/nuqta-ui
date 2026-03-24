<template>
  <CartPanel
    :items="cartItems"
    :units-map="cartItemUnitsMap"
    @increase="emit('increase', $event)"
    @decrease="emit('decrease', $event)"
    @remove="emit('remove', $event)"
    @unit-change="emit('unit-change', $event)"
  >
    <template #totals>
      <TotalsPanel :subtotal="subtotal" :discount="discount" :tax="tax" :total="total" />
    </template>

    <template #actions>
      <PosActionBar
        :can-pay="cartItems.length > 0"
        :can-clear="cartItems.length > 0"
        @pay="emit('pay')"
        @hold="emit('hold')"
        @discount="emit('discount')"
        @customer="emit('customer')"
        @clear="emit('clear')"
        @note="emit('note')"
        @more="emit('more')"
      />
    </template>
  </CartPanel>
</template>

<script setup lang="ts">
import CartPanel from '@/components/pos/CartPanel.vue';
import TotalsPanel from '@/components/pos/TotalsPanel.vue';
import PosActionBar from '@/components/pos/PosActionBar.vue';
import type { SaleItem } from '@/types/domain';
import type { ProductUnit } from '@/types/domain';

defineProps<{
  cartItems: SaleItem[];
  cartItemUnitsMap: Map<any, ProductUnit[]>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}>();

const emit = defineEmits<{
  increase: [index: number];
  decrease: [index: number];
  remove: [index: number];
  'unit-change': [payload: { index: number; unit: ProductUnit }];
  pay: [];
  hold: [];
  discount: [];
  customer: [];
  clear: [];
  note: [];
  more: [];
}>();
</script>
