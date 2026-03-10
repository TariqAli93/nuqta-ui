<template>
  <v-card
    hover
    link
    class="d-flex align-center pa-3"
    @click="handleSelect(product)"
    :disabled="!product.stock || product.stock <= 0"
  >
    <v-sheet
      color="grey-lighten-4"
      rounded="md"
      width="48"
      height="48"
      class="d-flex align-center justify-center shrink-0"
    >
      <v-icon size="24" color="grey">mdi-package-variant-closed</v-icon>
    </v-sheet>

    <div class="ms-3 grow overflow-hidden">
      <div class="text-body-2 font-weight-medium text-truncate">{{ product.name }}</div>
      <div v-if="showStock" class="text-caption text-medium-emphasis">
        {{ t('pos.stock') }}: {{ product.stock || 0 }}
      </div>
    </div>

    <div class="text-body-1 font-weight-bold text-primary text-no-wrap ms-3">
      {{ formatPrice(product.sellingPrice) }}
    </div>

    <v-badge
      v-if="!product.stock || product.stock <= 0"
      color="red"
      content="Out of Stock"
      class="ms-2"
    />
  </v-card>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import type { Product } from '@/types/domain';

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

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(price);
};
</script>
