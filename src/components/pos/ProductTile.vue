<template>
  <v-card
    hover
    link
    elevation="0"
    min-height="160"
    class="d-flex flex-column pa-0 border premium-product-card bg-surface"
    @click="handleSelect(product)"
    :class="{ 'out-of-stock': product.stock != null && product.stock <= 0 }"
  >
    <div class="position-relative">
      <v-sheet
        color="surface-variant"
        class="d-flex align-center justify-center product-image-wrapper"
      >
        <v-icon size="36" color="medium-emphasis" class="product-placeholder-icon"
          >mdi-image-outline</v-icon
        >
      </v-sheet>

      <v-chip
        v-if="product.stock != null && product.stock <= 0"
        color="error"
        size="small"
        variant="flat"
        class="position-absolute top-0 right-0 ma-2 font-weight-bold"
      >
        {{ t('pos.outOfStock') }}
      </v-chip>
    </div>

    <div class="pa-3 d-flex flex-column grow">
      <div class="text-body-2 font-weight-medium text-truncate mb-1" style="line-height: 1.2">
        {{ product.name }}
      </div>

      <div class="mt-auto d-flex align-end justify-space-between">
        <div
          class="text-subtitle-1 font-weight-bold text-primary text-no-wrap"
          style="line-height: 1"
        >
          {{ formatPrice(product.sellingPrice) }}
        </div>

        <div
          v-if="showStock && product.stock != null"
          class="text-caption text-medium-emphasis font-weight-medium"
        >
          {{ product.stock }}
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.premium-product-card {
  border-radius: 12px !important;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.premium-product-card:hover:not(.out-of-stock) {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.premium-product-card.out-of-stock {
  opacity: 0.6;
  filter: grayscale(0.8);
  pointer-events: none;
}

.product-image-wrapper {
  height: 90px;
  width: 100%;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-surface-variant), 0.5) 0%,
    rgba(var(--v-theme-surface-variant), 0.8) 100%
  );
}

.product-placeholder-icon {
  opacity: 0.5;
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
  // Allow selection when stock is untracked (null/undefined) or positive
  if (product.stock == null || product.stock > 0) {
    emit('select', product);
  }
};
</script>
