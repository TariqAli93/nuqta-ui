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
            عرض
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
      <template v-if="accountingStore.loading && !accountingStore.trialBalance.length">
        <v-row dense>
          <v-col v-for="n in 3" :key="n" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-skeleton-loader type="table" />
      </template>

      <!-- ───── Content ───── -->
      <template v-if="accountingStore.trialBalance.length">
        <!-- KPI summary strip -->
        <v-row dense>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border tb-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="error" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-arrow-top-right</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي المدين</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(totalDebit) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border tb-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="success" variant="tonal" size="48" rounded="lg">
                  <v-icon size="24">mdi-arrow-bottom-left</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">إجمالي الدائن</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(totalCredit) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border tb-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar
                  :color="isBalanced ? 'success' : 'error'"
                  variant="tonal"
                  size="48"
                  rounded="lg"
                >
                  <v-icon size="24">{{
                    isBalanced ? 'mdi-scale-balance' : 'mdi-scale-unbalanced'
                  }}</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">حالة التوازن</div>
                  <div class="text-h6 font-weight-bold">
                    {{ isBalanced ? 'متوازن' : 'غير متوازن' }}
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
          class="tb-eq-bar"
          rounded="lg"
        >
          <v-card-text class="d-flex align-center justify-center ga-2 py-2 text-body-2 flex-wrap">
            <v-icon size="18">{{ isBalanced ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
            <span>
              <strong>المدين</strong> {{ formatCurrency(totalDebit) }}
              <span class="mx-1 font-weight-bold">{{ isBalanced ? '=' : '≠' }}</span>
              <strong>الدائن</strong> {{ formatCurrency(totalCredit) }}
            </span>
            <v-chip v-if="!isBalanced" size="x-small" variant="elevated" color="error" class="ms-2">
              فرق {{ formatCurrency(Math.abs(totalDebit - totalCredit)) }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- Data table -->
        <div id="trial-balance-report">
          <v-card elevation="0" variant="flat" class="border" rounded="lg">
            <v-card-text class="pa-0">
              <v-data-table
                :headers="trialHeaders"
                :items="accountingStore.trialBalance"
                :loading="accountingStore.loading"
                density="comfortable"
                :items-per-page="20"
                class="ds-table-enhanced ds-table-striped"
              >
                <template #item.debit="{ item }">{{ formatCurrency(item.debit || 0) }}</template>
                <template #item.credit="{ item }">{{ formatCurrency(item.credit || 0) }}</template>
                <template #item.accountType="{ item }">
                  <v-chip :color="accountTypeColor(item.accountType)" size="small" variant="tonal">
                    {{ accountTypeLabel(item.accountType) }}
                  </v-chip>
                </template>
                <template #item.balance="{ item }">{{
                  formatCurrency(item.balance || 0)
                }}</template>
                <template #no-data>
                  <div class="text-center py-8 text-medium-emphasis">
                    لا توجد بيانات ميزان مراجعة بعد.
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </div>
      </template>
    </div>
  </SubPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAccountingStore } from '@/stores/accountingStore';
import { SubPageShell } from '@/components/layout';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import { useCurrency } from '@/composables/useCurrency';
import { useExportReport } from '@/composables/useExportReport';
import { useAccountingHelpers } from '@/composables/useAccountingHelpers';

const accountingStore = useAccountingStore();
const { isZeroDecimal, formatCurrency } = useCurrency();
const { exportToCSV, printReport } = useExportReport();
const { accountTypeColor, accountTypeLabel } = useAccountingHelpers();

const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);

const trialHeaders = [
  { title: 'الكود', key: 'accountCode', width: 90 },
  { title: 'الحساب', key: 'accountName', width: 150 },
  { title: 'نوع الحساب', key: 'accountType', width: 120 },
  { title: 'مدين', key: 'debit', align: 'end' as const, width: 120 },
  { title: 'دائن', key: 'credit', align: 'end' as const, width: 120 },
  { title: 'الرصيد', key: 'balance', align: 'end' as const, width: 120 },
];

const totalDebit = computed(() =>
  accountingStore.trialBalance.reduce((sum, row) => sum + (row.debit || 0), 0)
);

const totalCredit = computed(() =>
  accountingStore.trialBalance.reduce((sum, row) => sum + (row.credit || 0), 0)
);

// For zero-decimal currencies (IQD, JPY) use exact match;
// for decimal currencies allow a tiny floating-point tolerance.
const isBalanced = computed(() => {
  const diff = Math.abs(totalDebit.value - totalCredit.value);
  return isZeroDecimal.value ? diff === 0 : diff < 0.005;
});

async function refresh(): Promise<void> {
  await accountingStore.fetchTrialBalance({
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
  });
}

onMounted(async () => {
  await accountingStore.fetchTrialBalance();
});

function exportCSV() {
  exportToCSV(
    accountingStore.trialBalance as unknown as Record<string, unknown>[],
    'trial-balance',
    {
      accountCode: 'الكود',
      accountName: 'الحساب',
      accountType: 'نوع الحساب',
      debit: 'مدين',
      credit: 'دائن',
      balance: 'الرصيد',
    }
  );
}

function printTable() {
  printReport('trial-balance-report');
}
</script>

<style scoped>
.tb-kpi-card {
  transition: box-shadow 0.2s ease;
}
.tb-kpi-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
.tb-eq-bar,
.tb-eq-bar .v-card-text {
  color: #fff !important;
}
</style>
