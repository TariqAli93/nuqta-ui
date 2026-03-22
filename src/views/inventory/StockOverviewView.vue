<template>
  <div>
    <div class="nq-stats-grid nq-section">
      <StatCard
        icon="mdi-package-variant-closed"
        label="قيمة المخزون"
        :value="(inventoryStore.dashboard?.totalValuation ?? 0).toLocaleString('en-US')"
        color="primary"
      />
      <StatCard
        icon="mdi-alert-outline"
        label="منتجات منخفضة"
        :value="String(inventoryStore.dashboard?.lowStockCount ?? 0)"
        color="warning"
      />
      <StatCard
        icon="mdi-calendar-clock"
        label="تنبيهات صلاحية"
        :value="String(inventoryStore.dashboard?.expiryAlertCount ?? 0)"
        color="error"
      />
      <StatCard
        icon="mdi-swap-horizontal"
        label="حركات مسجلة"
        :value="String(inventoryStore.movementsTotal)"
        color="success"
      />
    </div>

    <v-card class="nq-table-card">
      <v-card-title class="px-4 py-3">آخر حركات المخزون</v-card-title>
      <v-data-table
        :headers="movementHeaders"
        :items="inventoryStore.movements"
        :loading="inventoryStore.loadingMovements || inventoryStore.loadingDashboard"
        density="comfortable"
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
          <EmptyState
            icon="mdi-swap-horizontal"
            title="لا توجد حركات مخزون بعد"
            description="ستظهر الحركات بعد البيع/الشراء/التعديل"
            min-height="200px"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { formatDate } from '@/utils/formatters';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useInventoryHelpers } from '@/composables/useInventoryHelpers';
import { useMovementTable } from '@/composables/useMovementTable';
import StatCard from '@/components/common/StatCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';

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
