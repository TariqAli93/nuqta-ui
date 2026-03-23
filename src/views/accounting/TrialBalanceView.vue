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
        عرض
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

    <div id="trial-balance-report">
      <v-data-table
        :headers="trialHeaders"
        :items="accountingStore.trialBalance"
        :loading="accountingStore.loading"
        density="compact"
        :items-per-page="20"
      >
        <template #item.debit="{ item }">{{ formatCurrency(item.debit || 0) }}</template>
        <template #item.credit="{ item }">{{ formatCurrency(item.credit || 0) }}</template>
        <template #item.accountType="{ item }">
          <v-chip :color="accountTypeColor(item.accountType)" size="small" variant="tonal">
            {{ accountTypeLabel(item.accountType) }}
          </v-chip>
        </template>

        <template #item.balance="{ item }">{{ formatCurrency(item.balance || 0) }}</template>
        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">لا توجد بيانات ميزان مراجعة بعد.</div>
        </template>
        <template #bottom>
          <v-divider />
          <v-row dense class="px-4 py-3">
            <v-col class="text-end font-weight-bold">
              إجمالي المدين: {{ formatCurrency(totalDebit) }}
            </v-col>
            <v-col class="text-end font-weight-bold">
              إجمالي الدائن: {{ formatCurrency(totalCredit) }}
            </v-col>
            <v-col class="text-end font-weight-bold">
              <v-chip :color="isBalanced ? 'success' : 'error'" size="small" variant="tonal">
                {{ isBalanced ? 'متوازن ✓' : 'غير متوازن ✗' }}
              </v-chip>
            </v-col>
          </v-row>
        </template>
      </v-data-table>
    </div>
  </v-card>
  </SubPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAccountingStore } from '@/stores/accountingStore';
import { SubPageShell } from '@/components/layout';
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
