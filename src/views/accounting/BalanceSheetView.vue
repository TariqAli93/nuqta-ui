<template>
  <SubPageShell>
    <div class="d-flex flex-column ga-4">
      <!-- ───── Filter toolbar ───── -->
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text class="d-flex align-center ga-3 flex-wrap py-3">
          <AppDateInput
            v-model="fromDate"
            label="من تاريخ"
            density="comfortable"
            hide-details
            variant="outlined"
            style="max-width: 200px"
            clearable
          />
          <AppDateInput
            v-model="toDate"
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
            عرض الميزانية
          </v-btn>
          <v-spacer />
          <v-btn-group variant="text" density="comfortable">
            <v-btn prepend-icon="mdi-download" @click="exportCSV"> تصدير CSV </v-btn>
            <v-btn prepend-icon="mdi-printer" @click="printTable"> طباعة </v-btn>
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
      <template v-if="accountingStore.loading && !bs">
        <v-row dense>
          <v-col v-for="n in 3" :key="n" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-skeleton-loader type="table" />
      </template>

      <!-- ───── Content (only when data loaded) ───── -->
      <div v-if="bs" id="balance-sheet-report" class="d-flex flex-column ga-4">
        <!-- KPI summary strip -->
        <v-row dense>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border bs-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="primary" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-bank</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي الأصول</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(bs.totalAssets ?? 0) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border bs-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="error" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-credit-card-outline</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي الالتزامات</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(bs.totalLiabilities ?? 0) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border bs-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="info" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-shield-account</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي حقوق الملكية</div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCurrency(bs.totalEquity ?? 0) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Balance equation bar -->
        <v-card
          elevation="0"
          variant="flat"
          :color="isBalanced ? 'success' : 'error'"
          class="bs-eq-bar"
          rounded="lg"
        >
          <v-card-text class="d-flex align-center justify-center ga-2 py-2 text-body-2 flex-wrap">
            <v-icon size="18">{{ isBalanced ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
            <span>
              <strong>الأصول</strong> {{ formatCurrency(bs.totalAssets ?? 0) }}
              <span class="mx-1 font-weight-bold">{{ isBalanced ? '=' : '≠' }}</span>
              <strong>الالتزامات</strong> {{ formatCurrency(bs.totalLiabilities ?? 0) }}
              +
              <strong>حقوق الملكية</strong> {{ formatCurrency(bs.totalEquity ?? 0) }}
            </span>
            <v-chip v-if="!isBalanced" size="x-small" variant="elevated" color="error" class="ms-2">
              فرق {{ formatCurrency(bs.difference ?? 0) }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- Diagnostic when unbalanced -->
        <v-alert v-if="!isBalanced" type="warning" variant="outlined" density="compact" closable>
          <strong>تشخيص عدم التوازن</strong>
          <div class="mt-2 text-body-2" dir="ltr" style="font-family: monospace">
            <div>Date range: {{ fromDate || '(all)' }} – {{ toDate || '(all)' }}</div>
            <div>
              Assets (debit)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=
              {{ bs.totalAssets }}
            </div>
            <div>Liabilities (credit)&nbsp;&nbsp;&nbsp;= {{ bs.totalLiabilities }}</div>
            <div>Equity accounts (credit) = {{ bs.equityAccounts }}</div>
            <div>
              Revenue net&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=
              {{ bs.revenueNet }}
            </div>
            <div>
              Expense net&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=
              {{ bs.expenseNet }}
            </div>
            <div>
              Current earnings&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= {{ bs.currentEarnings }}
            </div>
            <div>
              Total equity&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=
              {{ bs.totalEquity }}
            </div>
            <div>
              <strong
                >Difference&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;=
                {{ bs.difference }}</strong
              >
            </div>
          </div>
        </v-alert>

        <!-- ───── Detail columns ───── -->
        <v-row dense>
          <!-- Assets column -->
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border bs-section-card" rounded="lg">
              <div class="bs-section-header bg-primary">
                <v-icon size="18" class="me-2">mdi-bank</v-icon>
                الأصول
              </div>
              <v-list density="compact" class="py-0">
                <template v-if="(bs.assets || []).length">
                  <v-list-item
                    v-for="item in bs.assets"
                    :key="item.accountId"
                    class="bs-account-row"
                    rounded="0"
                  >
                    <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                    <template #append>
                      <span class="text-body-2 font-weight-medium text-no-wrap">
                        {{ formatCurrency(item.balance || 0) }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else>
                  <div class="text-center text-medium-emphasis py-4 w-100">
                    <v-icon size="32" class="mb-1 opacity-40">mdi-bank-off</v-icon>
                    <div class="text-caption">لا توجد أصول</div>
                  </div>
                </v-list-item>
              </v-list>
              <v-divider />
              <div
                class="d-flex align-center justify-space-between pa-3 bg-primary bs-section-footer"
              >
                <span class="text-body-2 font-weight-bold">الإجمالي</span>
                <span class="text-body-2 font-weight-bold">
                  {{ formatCurrency(bs.totalAssets ?? 0) }}
                </span>
              </div>
            </v-card>
          </v-col>

          <!-- Liabilities column -->
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border bs-section-card" rounded="lg">
              <div class="bs-section-header bg-error">
                <v-icon size="18" class="me-2">mdi-credit-card-outline</v-icon>
                الالتزامات
              </div>
              <v-list density="compact" class="py-0">
                <template v-if="(bs.liabilities || []).length">
                  <v-list-item
                    v-for="item in bs.liabilities"
                    :key="item.accountId"
                    class="bs-account-row"
                    rounded="0"
                  >
                    <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                    <template #append>
                      <span class="text-body-2 font-weight-medium text-no-wrap">
                        {{ formatCurrency(item.balance || 0) }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else>
                  <div class="text-center text-medium-emphasis py-4 w-100">
                    <v-icon size="32" class="mb-1 opacity-40">mdi-credit-card-off</v-icon>
                    <div class="text-caption">لا توجد التزامات</div>
                  </div>
                </v-list-item>
              </v-list>
              <v-divider />
              <div
                class="d-flex align-center justify-space-between pa-3 bg-error bs-section-footer"
              >
                <span class="text-body-2 font-weight-bold">الإجمالي</span>
                <span class="text-body-2 font-weight-bold">
                  {{ formatCurrency(bs.totalLiabilities ?? 0) }}
                </span>
              </div>
            </v-card>
          </v-col>

          <!-- Equity column -->
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border bs-section-card" rounded="lg">
              <div class="bs-section-header bg-info">
                <v-icon size="18" class="me-2">mdi-shield-account</v-icon>
                حقوق الملكية
              </div>
              <v-list density="compact" class="py-0">
                <template v-if="(bs.equity || []).length">
                  <v-list-item
                    v-for="item in bs.equity"
                    :key="item.accountId"
                    class="bs-account-row"
                    rounded="0"
                  >
                    <v-list-item-title class="text-body-2">{{ item.name }}</v-list-item-title>
                    <template #append>
                      <span class="text-body-2 font-weight-medium text-no-wrap">
                        {{ formatCurrency(item.balance || 0) }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <v-list-item v-else>
                  <div class="text-center text-medium-emphasis py-4 w-100">
                    <v-icon size="32" class="mb-1 opacity-40">mdi-shield-off</v-icon>
                    <div class="text-caption">لا توجد حسابات ملكية</div>
                  </div>
                </v-list-item>
                <!-- Current period earnings – always shown -->
                <v-divider />
                <v-list-item class="bs-account-row" rounded="0">
                  <v-list-item-title class="text-body-2 font-italic">
                    أرباح الفترة الحالية
                  </v-list-item-title>
                  <template #append>
                    <span
                      class="text-body-2 font-weight-medium text-no-wrap"
                      :class="(bs.currentEarnings ?? 0) >= 0 ? 'text-success' : 'text-error'"
                    >
                      {{ formatCurrency(bs.currentEarnings ?? 0) }}
                    </span>
                  </template>
                </v-list-item>
                <div class="px-4 pb-1">
                  <div class="text-caption text-medium-emphasis">
                    إيرادات {{ formatCurrency(bs.revenueNet ?? 0) }} − مصروفات
                    {{ formatCurrency(bs.expenseNet ?? 0) }}
                  </div>
                </div>
              </v-list>
              <v-divider />
              <div class="d-flex align-center justify-space-between pa-3 bg-info bs-section-footer">
                <span class="text-body-2 font-weight-bold">الإجمالي</span>
                <span class="text-body-2 font-weight-bold">
                  {{ formatCurrency(bs.totalEquity ?? 0) }}
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

const fromDate = ref<string | null>(null);
const toDate = ref<string | null>(null);

const bs = computed(() => accountingStore.balanceSheet);

const isBalanced = computed(() => {
  if (!bs.value) return true;
  return bs.value.difference === 0;
});

function exportCSV(): void {
  if (!bs.value) return;
  const rows = [
    ...((bs.value.assets || []) as Array<{ name: string; balance: number }>).map((r) => ({
      section: 'أصول',
      name: r.name,
      balance: r.balance,
    })),
    ...((bs.value.liabilities || []) as Array<{ name: string; balance: number }>).map((r) => ({
      section: 'التزامات',
      name: r.name,
      balance: r.balance,
    })),
    ...((bs.value.equity || []) as Array<{ name: string; balance: number }>).map((r) => ({
      section: 'حقوق ملكية',
      name: r.name,
      balance: r.balance,
    })),
  ];
  exportToCSV(rows, 'balance-sheet', { section: 'القسم', name: 'البند', amount: 'المبلغ' });
}

function printTable(): void {
  printReport('balance-sheet-report');
}

async function refresh(): Promise<void> {
  await accountingStore.fetchBalanceSheet({
    fromDate: fromDate.value || undefined,
    toDate: toDate.value || undefined,
  });
}

onMounted(async () => {
  await accountingStore.fetchBalanceSheet();
});
</script>

<style scoped>
.bs-kpi-card {
  transition: box-shadow 0.2s ease;
}
.bs-kpi-card:hover {
  box-shadow: 0 2px 8px rgb(var(--v-theme-on-surface), 0.08);
}

.bs-eq-bar {
  color: white;
}

.bs-section-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.bs-section-card .v-list {
  flex: 1 1 auto;
}

.bs-section-header {
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
}

.bs-section-footer {
  color: white;
  font-size: 0.875rem;
}

.bs-account-row + .bs-account-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
