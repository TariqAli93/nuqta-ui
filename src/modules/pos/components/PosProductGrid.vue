<template>
  <!-- Grid layout -->
  <v-row v-if="layout === 'grid'">
    <template v-if="loading">
      <v-col v-for="n in 12" :key="`sk-${n}`" cols="6" sm="4" md="3" lg="2" xl="2">
        <v-skeleton-loader type="card" />
      </v-col>
    </template>

    <template v-else-if="products.length > 0">
      <v-col
        v-for="(product, idx) in products"
        :key="product.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
        xl="2"
      >
        <ProductTile
          :product="product"
          :class="{ 'pos-highlight': idx === highlightedIndex }"
          @select="emit('add-to-cart', product)"
        />
      </v-col>
    </template>
  </v-row>

  <!-- List layout -->
  <div v-else>
    <template v-if="loading">
      <v-skeleton-loader v-for="n in 8" :key="`skl-${n}`" type="list-item-two-line" class="mb-2" />
    </template>

    <template v-else-if="products.length > 0">
      <ProductListItem
        v-for="(product, idx) in products"
        :key="product.id"
        :product="product"
        :class="['mb-2', { 'pos-highlight': idx === highlightedIndex }]"
        @select="emit('add-to-cart', product)"
      />
    </template>
  </div>

  <PosEmptyState v-if="products.length === 0 && !loading" />
</template>

<script setup lang="ts">
import ProductTile from '@/components/pos/ProductTile.vue';
import ProductListItem from '@/components/pos/ProductListItem.vue';
import PosEmptyState from './PosEmptyState.vue';
import type { Product } from '@/types/domain';

defineProps<{
  products: Product[];
  highlightedIndex: number;
  loading: boolean;
  layout: string;
}>();

const emit = defineEmits<{ 'add-to-cart': [product: Product] }>();
</script>

<style scoped>
.pos-highlight {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 8px;
}
</style>
