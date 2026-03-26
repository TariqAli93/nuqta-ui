<template>
  <PageShell>
    <PageHeader :title="t('dashboard.title')" :subtitle="t('dashboard.subtitle')">
      <template #actions>
        <v-btn
          class="win-ghost-btn"
          variant="outlined"
          size="small"
          :loading="isDownloadingSales"
          @click="exportSales"
        >
          تصدير المبيعات CSV
        </v-btn>
        <v-btn
          class="win-ghost-btn"
          variant="outlined"
          size="small"
          :loading="isDownloadingInventory"
          @click="exportInventory"
        >
          تصدير المخزون CSV
        </v-btn>
        <v-btn variant="text" icon size="small" :loading="loading" @click="loadStats">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </template>
    </PageHeader>

    <CardSkeleton :loading="loading" :count="4" :cols="3">
      <v-row dense>
        <v-col cols="12" sm="6" md="3">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="success" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-cash-register</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">مبيعات اليوم</div>
                <div class="text-h6 font-weight-bold">{{ stats?.salesToday?.count ?? 0 }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="primary" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-currency-usd</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">إيرادات اليوم</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatMoney(stats?.salesToday?.revenue ?? 0) }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="info" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-calculator</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">متوسط الفاتورة</div>
                <div class="text-h6 font-weight-bold">
                  {{
                    formatMoney(
                      stats?.salesToday?.count
                        ? stats.salesToday.revenue / stats.salesToday.count
                        : 0
                    )
                  }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar
                :color="(stats?.lowStockCount ?? 0) > 0 ? 'error' : 'grey'"
                variant="tonal"
                size="48"
                rounded="lg"
              >
                <v-icon size="24">mdi-alert-circle-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">منتجات منخفضة المخزون</div>
                <div class="text-h6 font-weight-bold">{{ stats?.lowStockCount ?? 0 }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </CardSkeleton>

    <v-card class="border mt-4" elevation="0" variant="flat" rounded="lg">
      <v-card-title
        class="d-flex align-center ga-2"
        style="padding: var(--ds-card-py) var(--ds-card-px) var(--ds-space-2)"
      >
        <v-icon color="primary" size="20">mdi-trending-up</v-icon>
        <span class="text-subtitle-1 font-weight-bold">أفضل المنتجات</span>
      </v-card-title>

      <TableSkeleton :loading="loading" :rows="5">
        <v-data-table
          :headers="topHeaders"
          :items="stats?.topProducts ?? []"
          density="comfortable"
          :items-per-page="5"
          no-data-text="لا توجد مبيعات بعد"
          class="ds-table-enhanced ds-table-striped"
        />
      </TableSkeleton>
    </v-card>
  </PageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PageShell, PageHeader } from '@/components/layout';
import { dashboardClient, type DashboardStats } from '@/api/endpoints/dashboard';
import { downloadInventoryReport, downloadSalesReport } from '@/api/endpoints/reports';
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
