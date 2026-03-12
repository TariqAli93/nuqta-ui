<template>
  <v-container fluid class="pa-6">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">{{ t('dashboard.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">{{ t('dashboard.subtitle') }}</p>
      </div>

      <div class="d-flex flex-wrap ga-2">
        <v-btn variant="outlined" :loading="isDownloadingSales" @click="exportSales">
          تصدير المبيعات CSV
        </v-btn>
        <v-btn
          variant="outlined"
          :loading="isDownloadingInventory"
          @click="exportInventory"
        >
          تصدير المخزون CSV
        </v-btn>
        <v-btn variant="text" icon size="small" :loading="loading" @click="loadStats">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </div>

    <CardSkeleton :loading="loading" :count="4" :cols="3">
      <v-row dense class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar color="success" variant="tonal" size="48">
                <v-icon>mdi-cash-register</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis">مبيعات اليوم</div>
                <div class="text-h6 font-weight-bold">{{ stats?.salesToday?.totalSales ?? 0 }}</div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar color="primary" variant="tonal" size="48">
                <v-icon>mdi-currency-usd</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis">إيرادات اليوم</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatMoney(stats?.salesToday?.totalRevenue ?? 0) }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar color="info" variant="tonal" size="48">
                <v-icon>mdi-calculator</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis">متوسط الفاتورة</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatMoney(stats?.salesToday?.averageSaleAmount ?? 0) }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar
                :color="(stats?.lowStockCount ?? 0) > 0 ? 'error' : 'grey'"
                variant="tonal"
                size="48"
              >
                <v-icon>mdi-alert-circle-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis">منتجات منخفضة المخزون</div>
                <div class="text-h6 font-weight-bold">{{ stats?.lowStockCount ?? 0 }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </CardSkeleton>

    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        <v-icon color="primary">mdi-trending-up</v-icon>
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
  </v-container>
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
