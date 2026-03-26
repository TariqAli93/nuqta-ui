<template>
  <SubPageShell>
    <div class="d-flex flex-column ga-4">
      <!-- ───── Filter toolbar ───── -->
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text class="d-flex align-center ga-3 flex-wrap py-3">
          <AppDateInput
            v-model="dateFrom"
            label="من تاريخ"
            density="comfortable"
            hide-details
            variant="outlined"
            style="max-width: 200px"
            clearable
          />
          <AppDateInput
            v-model="dateTo"
            label="إلى تاريخ"
            density="comfortable"
            hide-details
            variant="outlined"
            style="max-width: 200px"
            clearable
          />
          <v-btn
            color="primary"
            variant="tonal"
            class="win-btn"
            :loading="accountingStore.loading"
            prepend-icon="mdi-refresh"
            @click="refresh"
          >
            عرض التقرير
          </v-btn>
          <v-spacer />
          <v-btn-group variant="text" density="comfortable">
            <v-btn prepend-icon="mdi-download" @click="exportCSV">تصدير CSV</v-btn>
            <v-btn prepend-icon="mdi-printer" @click="printTable">طباعة</v-btn>
          </v-btn-group>
        </v-card-text>
      </v-card>

      <!-- Error -->
      <v-alert
        v-if="accountingStore.error && !accountingStore.loading"
        type="error"
        variant="tonal"
        closable
      >
        {{ accountingStore.error }}
      </v-alert>

      <!-- Loading skeleton -->
      <template v-if="accountingStore.loading && !pl">
        <v-row dense>
          <v-col v-for="n in 3" :key="n" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-skeleton-loader type="table" />
      </template>

      <!-- ───── Content (only when data loaded) ───── -->
      <div v-if="pl" id="profit-loss-report" class="d-flex flex-column ga-4">
        <!-- KPI summary strip -->
        <v-row dense>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border pl-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="success" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-trending-up</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي الإيرادات</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(pl.totalRevenue || 0) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border pl-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="error" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-trending-down</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي المصاريف</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(pl.totalExpenses || 0) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border pl-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar
                  :color="(pl.netIncome || 0) >= 0 ? 'primary' : 'warning'"
                  variant="tonal"
                  size="48"
                  rounded="lg"
                >
                  <v-icon size="24">mdi-cash-multiple</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">صافي الدخل</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(pl.netIncome || 0) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Net income equation bar -->
        <v-card
          elevation="0"
          variant="flat"
          :color="(pl.netIncome || 0) >= 0 ? 'success' : 'error'"
          class="pl-eq-bar"
          rounded="lg"
        >
          <v-card-text class="d-flex align-center justify-center ga-2 py-2 text-body-2 flex-wrap">
            <v-icon size="18">{{
              (pl.netIncome || 0) >= 0 ? 'mdi-check-circle' : 'mdi-alert-circle'
            }}</v-icon>
            <span>
              <strong>الإيرادات</strong> {{ formatCurrency(pl.totalRevenue || 0) }}
              <span class="mx-1 font-weight-bold">−</span>
              <strong>المصاريف</strong> {{ formatCurrency(pl.totalExpenses || 0) }}
              <span class="mx-1 font-weight-bold">=</span>
              <strong>صافي الدخل</strong> {{ formatCurrency(pl.netIncome || 0) }}
            </span>
          </v-card-text>
        </v-card>

        <!-- ───── Detail columns ───── -->
        <v-row dense>
          <!-- Revenue column -->
          <v-col cols="12" md="6">
            <v-card elevation="0" variant="flat" class="border pl-section-card" rounded="lg">
              <div class="pl-section-header bg-success">
                <v-icon size="18" class="me-2">mdi-trending-up</v-icon>
                الإيرادات
              </div>
              <v-list density="compact" class="py-0">
                <template v-if="(pl.revenue || []).length">
                  <v-list-item
                    v-for="item in pl.revenue"
                    :key="item.accountId"
                    class="pl-account-row"
                  >
                    <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                    <template #append>
                      <span class="text-body-2 font-weight-medium text-no-wrap">
                        {{ formatCurrency(item.amount || 0) }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else>
                  <div class="text-center text-medium-emphasis py-4 w-100">
                    <v-icon size="32" class="mb-1 opacity-40">mdi-cash-off</v-icon>
                    <div class="text-caption">لا توجد إيرادات</div>
                  </div>
                </v-list-item>
              </v-list>
              <v-divider />
              <div
                class="d-flex align-center justify-space-between pa-3 bg-success pl-section-footer"
              >
                <span class="text-body-2 font-weight-bold">الإجمالي</span>
                <span class="text-body-2 font-weight-bold">
                  {{ formatCurrency(pl.totalRevenue || 0) }}
                </span>
              </div>
            </v-card>
          </v-col>

          <!-- Expenses column -->
          <v-col cols="12" md="6">
            <v-card elevation="0" variant="flat" class="border pl-section-card" rounded="lg">
              <div class="pl-section-header bg-error">
                <v-icon size="18" class="me-2">mdi-trending-down</v-icon>
                المصاريف
              </div>
              <v-list density="compact" class="py-0">
                <template v-if="(pl.expenses || []).length">
                  <v-list-item
                    v-for="item in pl.expenses"
                    :key="item.accountId"
                    class="pl-account-row"
                  >
                    <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                    <template #append>
                      <span class="text-body-2 font-weight-medium text-no-wrap">
                        {{ formatCurrency(item.amount || 0) }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else>
                  <div class="text-center text-medium-emphasis py-4 w-100">
                    <v-icon size="32" class="mb-1 opacity-40">mdi-cash-off</v-icon>
                    <div class="text-caption">لا توجد مصاريف</div>
                  </div>
                </v-list-item>
              </v-list>
              <v-divider />
              <div
                class="d-flex align-center justify-space-between pa-3 bg-error pl-section-footer"
              >
                <span class="text-body-2 font-weight-bold">الإجمالي</span>
                <span class="text-body-2 font-weight-bold">
                  {{ formatCurrency(pl.totalExpenses || 0) }}
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
  </SubPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { SubPageShell } from '@/components/layout';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import { useCurrency } from '@/composables/useCurrency';
import { useExportReport } from '@/composables/useExportReport';
import { useAccountingStore } from '@/stores/accountingStore';

const { formatCurrency } = useCurrency();
const { exportToCSV, printReport } = useExportReport();
const accountingStore = useAccountingStore();

const pl = computed(() => accountingStore.profitLoss);

const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);

function exportCSV(): void {
  if (!pl.value) return;
  const rows = [
    ...((pl.value.revenue || []) as Array<{ name: string; amount: number }>).map((r) => ({
      section: 'إيرادات',
      name: r.name,
      amount: r.amount,
    })),
    ...((pl.value.expenses || []) as Array<{ name: string; amount: number }>).map((r) => ({
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

<style scoped>
.pl-kpi-card {
  transition: box-shadow 0.2s ease;
}
.pl-kpi-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
.pl-eq-bar,
.pl-eq-bar .v-card-text {
  color: #fff !important;
}
.pl-section-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.pl-section-header {
  padding: 10px 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
}
.pl-section-footer {
  color: #fff;
}
.pl-account-row + .pl-account-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
