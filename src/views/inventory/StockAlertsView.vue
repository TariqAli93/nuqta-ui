<template>
  <div>
    <div class="nq-stats-grid nq-section">
      <StatCard
        icon="mdi-alert-outline"
        label="منتجات منخفضة المخزون"
        :value="String(inventoryStore.dashboard?.lowStockCount ?? 0)"
        color="warning"
      />
      <StatCard
        icon="mdi-clock-alert-outline"
        label="تنبيهات الصلاحية"
        :value="String(inventoryStore.expiryAlerts.length)"
        color="error"
      />
    </div>

    <!-- Expiry Alerts Table -->
    <v-card class="nq-table-card">
      <v-card-title class="d-flex align-center px-4 py-3">
        <v-icon start color="error" size="20">mdi-clock-alert-outline</v-icon>
        تنبيهات الصلاحية
        <v-spacer />
        <v-text-field
          v-model.number="daysAhead"
          type="number"
          label="أيام للأمام"
          density="compact"
          hide-details
          style="max-width: 140px"
          min="1"
          @change="refreshAlerts"
        />
      </v-card-title>
      <v-data-table
        :headers="expiryHeaders"
        :items="inventoryStore.expiryAlerts"
        :loading="inventoryStore.loadingAlerts"
        density="comfortable"
        :items-per-page="15"
      >
        <template #item.expiryDate="{ item }">
          <v-chip
            size="x-small"
            variant="tonal"
            :color="isExpired(item.expiryDate) ? 'error' : 'warning'"
          >
            {{ formatDate(item.expiryDate) }}
          </v-chip>
        </template>
        <template #item.daysUntilExpiry="{ item }">
          <span :class="item.daysUntilExpiry <= 0 ? 'text-error font-weight-bold' : 'text-warning'">
            {{ item.daysUntilExpiry <= 0 ? 'منتهية' : `${item.daysUntilExpiry} يوم` }}
          </span>
        </template>
        <template #no-data>
          <EmptyState
            icon="mdi-check-circle-outline"
            icon-color="success"
            title="لا توجد تنبيهات صلاحية حالياً"
            min-height="200px"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { formatDate } from '@/utils/formatters';
import { useInventoryStore } from '@/stores/inventoryStore';
import StatCard from '@/components/common/StatCard.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const inventoryStore = useInventoryStore();

const daysAhead = ref(30);

const expiryHeaders = [
  { title: 'المنتج', key: 'productName' },
  { title: 'الدفعة', key: 'batchNumber', width: 120 },
  { title: 'تاريخ الصلاحية', key: 'expiryDate', width: 140 },
  { title: 'المتبقي', key: 'daysUntilExpiry', align: 'center' as const, width: 100 },
  { title: 'الكمية', key: 'quantityOnHand', align: 'center' as const, width: 80 },
];

function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const today = new Date();
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return expiry <= today;
}

async function refreshAlerts(): Promise<void> {
  await inventoryStore.fetchExpiryAlerts(daysAhead.value);
}

onMounted(async () => {
  await Promise.all([
    inventoryStore.fetchDashboard(),
    inventoryStore.fetchExpiryAlerts(daysAhead.value),
  ]);
});
</script>
