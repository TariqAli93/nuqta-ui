<template>
  <v-card
    hover
    link
    class="d-flex flex-column pa-2 pos-product-tile"
    @click="handleSelect(product)"
    :disabled="product.stock != null && product.stock <= 0"
  >
    <v-badge
      v-if="product.stock != null && product.stock <= 0"
      color="red"
      :content="t('pos.outOfStock')"
      class="pos-oos-badge"
    ></v-badge>

    <div class="text-body-2 font-weight-medium text-truncate">{{ product.name }}</div>

    <div class="text-subtitle-1 font-weight-bold text-primary mt-auto text-no-wrap">
      {{ formatPrice(product.sellingPrice) }}
    </div>

    <div v-if="showStock && product.stock != null" class="text-caption text-disabled">
      {{ product.stock }}
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import type { Product } from '@/types/domain';
import { formatPrice } from '@/utils/format';

interface Props {
  product: Product;
  showStock?: boolean;
}

withDefaults(defineProps<Props>(), {
  showStock: true,
});

const emit = defineEmits<{
  select: [product: Product];
}>();

const handleSelect = (product: Product) => {
  // Allow selection when stock is untracked (null/undefined) or positive
  if (product.stock == null || product.stock > 0) {
    emit('select', product);
  }
};
</script>

<style scoped>
.pos-product-tile {
  min-height: 72px;
  justify-content: center;
}
</style>
