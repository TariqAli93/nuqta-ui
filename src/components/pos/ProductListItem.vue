<template>
  <v-card
    hover
    link
    elevation="0"
    class="d-flex align-center pa-2 border premium-list-item bg-surface"
    @click="handleSelect(product)"
    :class="{ 'out-of-stock': product.stock != null && product.stock <= 0 }"
  >
    <v-sheet
      color="surface-variant"
      width="56"
      height="56"
      class="d-flex align-center justify-center shrink-0 rounded-lg image-wrapper border"
    >
      <v-icon size="24" color="medium-emphasis">mdi-image-outline</v-icon>
    </v-sheet>

    <div class="ms-4 grow overflow-hidden">
      <div class="text-body-1 font-weight-medium text-truncate">{{ product.name }}</div>
      <div class="d-flex align-center mt-1">
        <div class="text-subtitle-2 font-weight-bold text-primary text-no-wrap">
          {{ formatPrice(product.sellingPrice) }}
        </div>
        <v-divider vertical class="mx-3 align-self-center border-opacity-50" style="height: 12px;"></v-divider>
        <div v-if="showStock && product.stock != null" class="text-caption text-medium-emphasis">
          {{ product.stock }} {{ t('pos.stock') }}
        </div>
      </div>
    </div>

    <v-chip
      v-if="product.stock != null && product.stock <= 0"
      color="error"
      size="small"
      variant="flat"
      class="ms-2 font-weight-bold"
    >
      {{ t('pos.outOfStock') }}
    </v-chip>
    <v-btn v-else icon variant="text" size="small" color="primary" class="ms-2 me-1 bg-primary-lighten-4 rounded-circle">
      <v-icon size="20">mdi-plus</v-icon>
    </v-btn>
  </v-card>
</template>

<style scoped>
.premium-list-item {
  border-radius: 12px !important;
  transition: all 0.2s ease;
}

.premium-list-item:hover:not(.out-of-stock) {
  transform: translateX(4px);
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
  background-color: rgba(var(--v-theme-primary), 0.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important;
}

.premium-list-item.out-of-stock {
  opacity: 0.6;
  filter: grayscale(0.8);
  pointer-events: none;
}

.image-wrapper {
  background: linear-gradient(135deg, rgba(var(--v-theme-surface-variant), 0.3) 0%, rgba(var(--v-theme-surface-variant), 0.6) 100%);
}
</style>

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
  if (product.stock && product.stock > 0) {
    emit('select', product);
  }
};
</script>
