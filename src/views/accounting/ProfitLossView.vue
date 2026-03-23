<template>
  <SubPageShell>
    <v-card flat>
    <v-card-text class="d-flex align-center ga-3 flex-wrap">
      <v-text-field
        v-model="dateFrom"
        type="date"
        label="من تاريخ"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 200px"
        clearable
      />
      <v-text-field
        v-model="dateTo"
        type="date"
        label="إلى تاريخ"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 200px"
        clearable
      />
      <v-btn color="primary" variant="tonal" :loading="accountingStore.loading" @click="refresh">
        عرض التقرير
      </v-btn>
      <v-spacer />
      <v-btn variant="text" size="small" prepend-icon="mdi-download" @click="exportCSV"
        >تصدير CSV</v-btn
      >
      <v-btn variant="text" size="small" prepend-icon="mdi-printer" @click="printTable"
        >طباعة</v-btn
      >
    </v-card-text>

    <v-alert
      v-if="accountingStore.error && !accountingStore.loading"
      type="error"
      variant="tonal"
      class="mx-4 mb-4"
      closable
    >
      {{ accountingStore.error }}
    </v-alert>

    <v-skeleton-loader
      v-if="accountingStore.loading && !accountingStore.profitLoss"
      type="table"
      class="mx-4"
    />

    <div id="profit-loss-report">
      <v-row dense class="px-4 mb-4">
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center">
              <div class="text-caption">إجمالي الإيرادات</div>
              <div class="text-h6">
                {{ formatCurrency(accountingStore.profitLoss?.totalRevenue || 0) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="tonal" color="error">
            <v-card-text class="text-center">
              <div class="text-caption">إجمالي المصاريف</div>
              <div class="text-h6">
                {{ formatCurrency(accountingStore.profitLoss?.totalExpenses || 0) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card
            variant="tonal"
            :color="(accountingStore.profitLoss?.netIncome || 0) >= 0 ? 'primary' : 'warning'"
          >
            <v-card-text class="text-center">
              <div class="text-caption">صافي الدخل</div>
              <div class="text-h6">
                {{ formatCurrency(accountingStore.profitLoss?.netIncome || 0) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Detailed breakdown -->
      <v-card-text v-if="accountingStore.profitLoss">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-card class="mb-3">
              <v-card-title class="text-subtitle-2 font-weight-bold bg-success-lighten-4">
                الإيرادات
              </v-card-title>
              <v-list density="compact">
                <v-list-item
                  v-for="item in accountingStore.profitLoss.revenue || []"
                  :key="item.accountId"
                >
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  <template #append>
                    <span class="font-weight-medium">{{ formatCurrency(item.amount || 0) }}</span>
                  </template>
                </v-list-item>
                <v-list-item v-if="!(accountingStore.profitLoss.revenue || []).length">
                  <v-list-item-title class="text-medium-emphasis"
                    >لا توجد إيرادات</v-list-item-title
                  >
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="mb-3">
              <v-card-title class="text-subtitle-2 font-weight-bold bg-error-lighten-4">
                المصاريف
              </v-card-title>
              <v-list density="compact">
                <v-list-item
                  v-for="item in accountingStore.profitLoss.expenses || []"
                  :key="item.accountId"
                >
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  <template #append>
                    <span class="font-weight-medium">{{ formatCurrency(item.amount || 0) }}</span>
                  </template>
                </v-list-item>
                <v-list-item v-if="!(accountingStore.profitLoss.expenses || []).length">
                  <v-list-item-title class="text-medium-emphasis">لا توجد مصاريف</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </div>
  </v-card>
  </SubPageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { SubPageShell } from '@/components/layout';
import { useCurrency } from '@/composables/useCurrency';
import { useExportReport } from '@/composables/useExportReport';
import { useAccountingStore } from '@/stores/accountingStore';

const { formatCurrency } = useCurrency();
const { exportToCSV, printReport } = useExportReport();
const accountingStore = useAccountingStore();

const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);

function exportCSV(): void {
  const pl = accountingStore.profitLoss;
  if (!pl) return;
  const rows = [
    ...((pl.revenue || []) as Array<{ name: string; amount: number }>).map((r) => ({
      section: 'إيرادات',
      name: r.name,
      amount: r.amount,
    })),
    ...((pl.expenses || []) as Array<{ name: string; amount: number }>).map((r) => ({
      section: 'مصاريف',
      name: r.name,
      amount: r.amount,
    })),
  ];
  exportToCSV(rows, 'profit-loss', { section: 'القسم', name: 'اسم الحساب', balance: 'الرصيد' });
}

function printTable(): void {
  printReport('profit-loss-report');
}

async function refresh(): Promise<void> {
  await accountingStore.fetchProfitLoss({
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
  });
}

onMounted(async () => {
  await accountingStore.fetchProfitLoss();
});
</script>
