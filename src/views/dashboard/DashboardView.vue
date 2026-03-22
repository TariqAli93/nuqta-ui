<template>
  <div class="nq-page">
    <PageHeader :title="t('dashboard.title')" :subtitle="t('dashboard.subtitle')">
      <template #actions>
        <v-btn variant="outlined" :loading="isDownloadingSales" @click="exportSales">
          تصدير المبيعات CSV
        </v-btn>
        <v-btn variant="outlined" :loading="isDownloadingInventory" @click="exportInventory">
          تصدير المخزون CSV
        </v-btn>
        <v-btn variant="text" icon size="small" :loading="loading" @click="loadStats">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </template>
    </PageHeader>

    <CardSkeleton :loading="loading" :count="4" :cols="3">
      <div class="nq-stats-grid nq-section">
        <StatCard
          icon="mdi-cash-register"
          label="مبيعات اليوم"
          :value="String(stats?.salesToday?.totalSales ?? 0)"
          color="success"
        />
        <StatCard
          icon="mdi-currency-usd"
          label="إيرادات اليوم"
          :value="formatMoney(stats?.salesToday?.totalRevenue ?? 0)"
          color="primary"
        />
        <StatCard
          icon="mdi-calculator"
          label="متوسط الفاتورة"
          :value="formatMoney(stats?.salesToday?.averageSaleAmount ?? 0)"
          color="info"
        />
        <StatCard
          icon="mdi-alert-circle-outline"
          label="منتجات منخفضة المخزون"
          :value="String(stats?.lowStockCount ?? 0)"
          :color="(stats?.lowStockCount ?? 0) > 0 ? 'error' : 'default'"
        />
      </div>
    </CardSkeleton>

    <v-card class="nq-table-card">
      <v-card-title class="d-flex align-center ga-2 px-4 py-3">
        <v-icon color="primary" size="20">mdi-trending-up</v-icon>
        أفضل المنتجات
      </v-card-title>

      <TableSkeleton :loading="loading" :rows="5">
        <v-data-table
          :headers="topHeaders"
          :items="stats?.topProducts ?? []"
          density="comfortable"
          :items-per-page="5"
          no-data-text="لا توجد مبيعات بعد"
        />
      </TableSkeleton>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { dashboardClient, type DashboardStats } from '@/api/endpoints/dashboard';
import {
  downloadInventoryReport,
  downloadSalesReport,
} from '@/api/endpoints/reports';
import CardSkeleton from '@/components/shared/CardSkeleton.vue';
import TableSkeleton from '@/components/shared/TableSkeleton.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatCard from '@/components/common/StatCard.vue';
import { useApiError } from '@/composables/useApiError';
import { useFileDownload } from '@/composables/useFileDownload';
import { t } from '@/i18n/t';
import { notifyError } from '@/utils/notify';

const stats = ref<DashboardStats | null>(null);
const loading = ref(false);

const { handleError } = useApiError();
const {
  download: downloadSalesFile,
  isDownloading: isDownloadingSales,
  error: salesDownloadError,
} = useFileDownload();
const {
  download: downloadInventoryFile,
  isDownloading: isDownloadingInventory,
  error: inventoryDownloadError,
} = useFileDownload();

const topHeaders = [
  { title: 'المنتج', key: 'productName' },
  { title: 'الكمية المباعة', key: 'totalQuantity', align: 'center' as const },
  { title: 'الإيرادات', key: 'totalRevenue', align: 'end' as const },
];

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', { numberingSystem: 'latn' }).format(amount);
}

async function loadStats(): Promise<void> {
  loading.value = true;
  const result = await dashboardClient.getStats();
  loading.value = false;

  if (result.ok) {
    stats.value = result.data;
    return;
  }

  handleError(result, { dedupeKey: 'dashboard-load' });
}

async function exportSales(): Promise<void> {
  await downloadSalesFile(
    () => downloadSalesReport({ format: 'csv' }),
    `sales-report-${new Date().toISOString().slice(0, 10)}.csv`
  );

  if (salesDownloadError.value) {
    notifyError(salesDownloadError.value, { dedupeKey: 'dashboard-sales-report' });
  }
}

async function exportInventory(): Promise<void> {
  await downloadInventoryFile(
    () => downloadInventoryReport({ format: 'csv' }),
    `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
  );

  if (inventoryDownloadError.value) {
    notifyError(inventoryDownloadError.value, { dedupeKey: 'dashboard-inventory-report' });
  }
}

onMounted(() => {
  void loadStats();
});
</script>
