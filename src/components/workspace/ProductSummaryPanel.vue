<template>
  <v-card class="d-flex flex-column border" elevation="0" variant="flat" rounded="lg">
    <v-card-title class="d-flex align-center">
      <span class="text-subtitle-1 font-weight-bold">ملخص المنتج</span>
      <v-spacer />
      <template v-if="product">
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          @click="$emit('deleteProduct')"
        />
      </template>
    </v-card-title>

    <v-card-text class="grow">
      <v-skeleton-loader v-if="loading" type="article, actions" />
      <template v-else-if="product">
        <div class="text-h6 font-weight-bold mb-1">{{ product.name }}</div>
        <div class="text-caption text-medium-emphasis mb-4">
          SKU: {{ product.sku || '—' }} | باركود: {{ product.barcode || '—' }}
        </div>

        <v-row dense class="mb-2">
          <v-col cols="6">
            <v-card variant="tonal" color="primary">
              <v-card-text class="text-center">
                <div class="text-caption">المخزون الحالي</div>
                <div class="text-body-1 font-weight-medium">{{ product.stock ?? 0 }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card variant="tonal" :color="stockStatusColor">
              <v-card-text class="text-center">
                <div class="text-caption">حالة المخزون</div>
                <div class="text-body-1 font-weight-medium">{{ stockStatusText }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row dense class="mb-2">
          <v-col cols="6">
            <v-card variant="tonal">
              <v-card-text class="text-center">
                <div class="text-caption">سعر التكلفة</div>
                <div class="text-body-1 font-weight-medium">
                  {{ formatMoney(product.costPrice) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center">
                <div class="text-caption">سعر البيع</div>
                <div class="text-body-1 font-weight-medium">
                  {{ formatMoney(product.sellingPrice) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-sheet
          v-if="product.isExpire"
          class="d-flex align-center ga-2 px-3 py-2 mb-2 text-warning"
          color="transparent"
        >
          <v-icon size="18">mdi-alert</v-icon>
          <span>المنتج يتتبع الصلاحية. تاريخ الانتهاء: {{ product.expireDate || 'غير محدد' }}</span>
        </v-sheet>
      </template>

      <div v-else class="d-flex flex-column align-center justify-center h-100 text-medium-emphasis">
        <v-icon size="42" class="mb-2">mdi-package-variant-closed</v-icon>
        <div>اختر منتجاً من القائمة لعرض التفاصيل</div>
      </div>
    </v-card-text>

    <v-divider />
    <v-card-actions>
      <v-btn
        class="win-btn"
        color="primary"
        variant="tonal"
        :disabled="!product"
        @click="$emit('openAdjustStock')"
      >
        تعديل المخزون
      </v-btn>
      <v-spacer />
      <v-btn
        class="win-btn"
        color="primary"
        variant="flat"
        :disabled="!product"
        @click="$emit('editProduct')"
        >تعديل المنتج</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCurrency } from '@/composables/useCurrency';
import type { Product } from '@/types/domain';

const { formatCurrency: formatMoney } = useCurrency();

const props = defineProps<{
  product: Product | null;
  loading: boolean;
}>();

defineEmits<{
  editProduct: [];
  deleteProduct: [];
  openBarcode: [];
  openAdjustStock: [];
}>();

type StockStatus = 'out_of_stock' | 'low_stock' | 'available';

const stockStatus = computed<StockStatus>(() => {
  if (!props.product || (props.product.stock ?? 0) === 0) return 'out_of_stock';
  if ((props.product.stock ?? 0) <= (props.product.minStock ?? 0)) return 'low_stock';
  return 'available';
});

const stockStatusText = computed(() => {
  const labels: Record<StockStatus, string> = {
    out_of_stock: 'نفذ المخزون',
    low_stock: 'مخزون منخفض',
    available: 'متوفر',
  };
  return labels[stockStatus.value];
});

const stockStatusColor = computed(() => {
  const colors: Record<StockStatus, string> = {
    out_of_stock: 'error',
    low_stock: 'warning',
    available: 'success',
  };
  return colors[stockStatus.value];
});
</script>
