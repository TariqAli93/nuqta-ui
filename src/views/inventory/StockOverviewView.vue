<template>
  <SubPageShell>
    <v-row dense class="mb-3">
      <v-col cols="6" md="3">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <div class="text-caption">قيمة المخزون</div>
            <div class="text-h6">
              {{ (inventoryStore.dashboard?.totalValuation ?? 0).toLocaleString('en-US') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="tonal" color="warning">
          <v-card-text class="text-center">
            <div class="text-caption">منتجات منخفضة</div>
            <div class="text-h6">{{ inventoryStore.dashboard?.lowStockCount ?? 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="tonal" color="error">
          <v-card-text class="text-center">
            <div class="text-caption">تنبيهات صلاحية</div>
            <div class="text-h6">{{ inventoryStore.dashboard?.expiryAlertCount ?? 0 }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="tonal" color="success">
          <v-card-text class="text-center">
            <div class="text-caption">حركات مسجلة</div>
            <div class="text-h6">{{ inventoryStore.movementsTotal }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card elevation="0" variant="flat" class="border" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">آخر حركات المخزون</v-card-title>
      <v-card-text class="pa-0">
      <v-data-table
        :headers="movementHeaders"
        :items="inventoryStore.movements"
        :loading="inventoryStore.loadingMovements || inventoryStore.loadingDashboard"
        density="comfortable"
        class="ds-table-enhanced ds-table-striped"
        :items-per-page="10"
      >
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item.movementType="{ item }">
          <v-chip size="x-small" variant="tonal" :color="movementColor(item.movementType)">
            {{ movementLabel(item.movementType) }}
          </v-chip>
        </template>
        <template #item.reason="{ item }">
          <v-chip size="x-small" variant="tonal" :color="reasonSignedColor(item.reason)">
            {{ reasonLabel(item.reason) || '—' }}
          </v-chip>
        </template>
        <template #item.sourceType="{ item }">
          <v-chip size="x-small" variant="tonal" :color="reasonSignedColor(item.sourceType || '')">
            {{ reasonLabel(item.sourceType || '') }}
          </v-chip>
        </template>
        <template #item.quantityBase="{ item }">
          <span :class="movementSignedClass(item.movementType)">
            {{ movementSignedPrefix(item.movementType) }}{{ item.quantityBase }}
          </span>
        </template>
        <template #item.productName="{ item }">{{ getProductName(item.productId) }}</template>
        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">
            لا توجد حركات مخزون بعد. ستظهر الحركات بعد البيع/الشراء/التعديل.
          </div>
        </template>
      </v-data-table>
      </v-card-text>
    </v-card>
  </SubPageShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { SubPageShell } from '@/components/layout';
import { formatDate } from '@/utils/formatters';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useInventoryHelpers } from '@/composables/useInventoryHelpers';
import { useMovementTable } from '@/composables/useMovementTable';

const inventoryStore = useInventoryStore();
const {
  movementLabel,
  movementColor,
  movementSignedPrefix,
  movementSignedClass,
  reasonLabel,
  reasonSignedColor,
} = useInventoryHelpers();
const { movementHeaders, getProductName, ensureProducts } = useMovementTable();

onMounted(async () => {
  await Promise.all([
    inventoryStore.fetchDashboard(),
    inventoryStore.fetchMovements({ limit: 10, offset: 0 }),
    ensureProducts(),
  ]);
});
</script>
