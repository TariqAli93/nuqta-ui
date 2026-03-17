<template>
  <v-card flat>
    <v-card-text class="d-flex align-center ga-3 flex-wrap">
      <v-text-field
        v-model="fromDate"
        type="date"
        label="من تاريخ"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 200px"
        clearable
      />
      <v-text-field
        v-model="toDate"
        type="date"
        label="إلى تاريخ"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 200px"
        clearable
      />
      <v-btn color="primary" variant="tonal" :loading="accountingStore.loading" @click="refresh">
        عرض الميزانية
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
      v-if="accountingStore.loading && !accountingStore.balanceSheet"
      type="table"
      class="mx-4"
    />

    <!-- Summary cards -->
    <v-row dense class="px-4 mb-4">
      <v-col cols="12" md="4">
        <v-card variant="tonal" color="primary">
          <v-card-text class="text-center">
            <div class="text-caption">إجمالي الأصول</div>
            <div class="text-h6">
              {{ formatCurrency(bs?.totalAssets ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="tonal" color="error">
          <v-card-text class="text-center">
            <div class="text-caption">إجمالي الالتزامات</div>
            <div class="text-h6">
              {{ formatCurrency(bs?.totalLiabilities ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="tonal" color="info">
          <v-card-text class="text-center">
            <div class="text-caption">إجمالي حقوق الملكية</div>
            <div class="text-h6">
              {{ formatCurrency(bs?.totalEquity ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Equity breakdown card -->
    <v-row dense class="px-4 mb-4">
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <div class="text-caption">حسابات حقوق الملكية</div>
            <div class="text-subtitle-1 font-weight-medium">
              {{ formatCurrency(bs?.equityAccounts ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <div class="text-caption">أرباح الفترة الحالية</div>
            <div
              class="text-subtitle-1 font-weight-medium"
              :class="(bs?.currentEarnings ?? 0) >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(bs?.currentEarnings ?? 0) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              إيرادات {{ formatCurrency(bs?.revenueNet ?? 0) }} − مصروفات
              {{ formatCurrency(bs?.expenseNet ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card variant="outlined">
          <v-card-text class="text-center">
            <div class="text-caption">الفرق (يجب أن يكون ٠)</div>
            <div
              class="text-subtitle-1 font-weight-medium"
              :class="(bs?.difference ?? 0) === 0 ? 'text-success' : 'text-error'"
            >
              {{ formatCurrency(bs?.difference ?? 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Balance equation check -->
    <v-row dense class="px-4 mb-4">
      <v-col cols="12">
        <v-alert :type="isBalanced ? 'success' : 'error'" variant="tonal" density="compact">
          <strong>معادلة الميزانية:</strong>
          الأصول ({{ formatCurrency(bs?.totalAssets ?? 0) }})
          {{ isBalanced ? '=' : '≠' }}
          الالتزامات ({{ formatCurrency(bs?.totalLiabilities ?? 0) }}) + حقوق الملكية ({{
            formatCurrency(bs?.totalEquity ?? 0)
          }})
          <template v-if="!isBalanced"> — فرق: {{ formatCurrency(bs?.difference ?? 0) }} </template>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Diagnostic alert when unbalanced -->
    <v-row v-if="bs && !isBalanced" dense class="px-4 mb-4">
      <v-col cols="12">
        <v-alert type="warning" variant="outlined" density="compact" closable>
          <strong>تشخيص عدم التوازن</strong>
          <div class="mt-1 text-body-2" dir="ltr" style="font-family: monospace">
            <div>Date range: {{ fromDate || '(all)' }} – {{ toDate || '(all)' }}</div>
            <div>Assets (debit nature) = {{ bs.totalAssets }}</div>
            <div>Liabilities (credit nature) = {{ bs.totalLiabilities }}</div>
            <div>Equity accounts (credit nature) = {{ bs.equityAccounts }}</div>
            <div>Revenue net = {{ bs.revenueNet }}</div>
            <div>Expense net = {{ bs.expenseNet }}</div>
            <div>Current earnings = {{ bs.currentEarnings }}</div>
            <div>Total equity = {{ bs.totalEquity }}</div>
            <div>
              <strong>Difference = {{ bs.difference }}</strong>
            </div>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Detailed sections -->
    <v-card-text v-if="bs">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-card class="mb-3">
            <v-card-title class="text-subtitle-2 font-weight-bold bg-primary-lighten-4">
              الأصول
            </v-card-title>
            <v-list density="compact">
              <v-list-item v-for="item in bs.assets || []" :key="item.accountId">
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{ formatCurrency(item.balance || 0) }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="!(bs.assets || []).length">
                <v-list-item-title class="text-medium-emphasis">لا توجد أصول</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="mb-3">
            <v-card-title class="text-subtitle-2 font-weight-bold bg-error-lighten-4">
              الالتزامات
            </v-card-title>
            <v-list density="compact">
              <v-list-item v-for="item in bs.liabilities || []" :key="item.accountId">
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{ formatCurrency(item.balance || 0) }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="!(bs.liabilities || []).length">
                <v-list-item-title class="text-medium-emphasis">لا توجد التزامات</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="mb-3">
            <v-card-title class="text-subtitle-2 font-weight-bold bg-info-lighten-4">
              حقوق الملكية
            </v-card-title>
            <v-list density="compact">
              <v-list-item v-for="item in bs.equity || []" :key="item.accountId">
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{ formatCurrency(item.balance || 0) }}</span>
                </template>
              </v-list-item>
              <!-- Current period earnings -->
              <v-list-item>
                <v-list-item-title class="font-italic"> أرباح الفترة الحالية </v-list-item-title>
                <template #append>
                  <span
                    class="font-weight-medium"
                    :class="(bs.currentEarnings ?? 0) >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ formatCurrency(bs.currentEarnings ?? 0) }}
                  </span>
                </template>
              </v-list-item>
              <v-divider />
              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  إجمالي حقوق الملكية
                </v-list-item-title>
                <template #append>
                  <span class="font-weight-bold">{{ formatCurrency(bs.totalEquity ?? 0) }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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
