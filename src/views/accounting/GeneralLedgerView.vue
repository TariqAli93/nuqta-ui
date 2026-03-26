<template>
  <PageShell>
    <PageHeader
      :title="account ? account.name : ''"
      :subtitle="ledgerSubtitle"
      show-back
      :back-to="{ name: 'AccountingAccounts' }"
    />

    <div class="d-flex flex-column ga-4">
      <!-- ───── Filter toolbar ───── -->
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text class="d-flex align-center ga-3 flex-wrap py-3">
          <div v-if="account">
            <div class="text-h6 font-weight-bold">{{ account.code }} — {{ account.name }}</div>
            <v-chip
              size="small"
              variant="tonal"
              :color="accountTypeColor(account.accountType)"
              class="mt-1"
            >
              {{ accountTypeLabel(account.accountType) }}
            </v-chip>
          </div>
          <v-skeleton-loader v-else type="text" width="300" />

          <v-spacer />

          <AppDateInput
            v-model="dateFrom"
            label="من تاريخ"
            density="comfortable"
            hide-details
            variant="outlined"
            style="max-width: 180px"
            clearable
          />
          <AppDateInput
            v-model="dateTo"
            label="إلى تاريخ"
            density="comfortable"
            hide-details
            variant="outlined"
            style="max-width: 180px"
            clearable
          />
          <v-btn
            color="primary"
            variant="tonal"
            class="win-btn"
            :loading="loading"
            prepend-icon="mdi-refresh"
            @click="loadLedger"
          >
            عرض
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Error -->
      <v-alert v-if="errorMsg" type="error" variant="tonal" closable>
        {{ errorMsg }}
      </v-alert>

      <!-- Loading skeleton -->
      <template v-if="loading && !entries.length">
        <v-row dense>
          <v-col v-for="n in 3" :key="n" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-skeleton-loader type="table" />
      </template>

      <!-- ───── Content ───── -->
      <template v-if="entries.length">
        <!-- KPI summary strip -->
        <v-row dense>
          <v-col cols="12" md="4">
            <v-card elevation="0" variant="flat" class="border gl-kpi-card" rounded="lg">
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
            <v-card elevation="0" variant="flat" class="border gl-kpi-card" rounded="lg">
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
            <v-card elevation="0" variant="flat" class="border gl-kpi-card" rounded="lg">
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar
                  :color="closingBalance >= 0 ? 'primary' : 'warning'"
                  variant="tonal"
                  size="48"
                  rounded="lg"
                >
                  <v-icon size="24">mdi-cash-register</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis">الرصيد الختامي</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(closingBalance) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Ledger table -->
        <v-card elevation="0" variant="flat" class="border" rounded="lg">
          <v-card-text class="pa-0">
            <v-data-table
              :headers="headers"
              :items="entries"
              :loading="loading"
              density="comfortable"
              :items-per-page="25"
              :items-per-page-options="[10, 25, 50, 100]"
              class="ds-table-enhanced ds-table-striped"
            >
              <template #item.entryDate="{ item }">
                {{ formatDate(item.entryDate) }}
              </template>
              <template #item.entryNumber="{ item }">
                <a class="text-primary cursor-pointer" @click="goToEntry(item.journalEntryId)">
                  {{ item.entryNumber }}
                </a>
              </template>
              <template #item.debit="{ item }">
                <span v-if="item.debit" class="text-error">{{ formatCurrency(item.debit) }}</span>
              </template>
              <template #item.credit="{ item }">
                <span v-if="item.credit" class="text-success">{{
                  formatCurrency(item.credit)
                }}</span>
              </template>
              <template #item.runningBalance="{ item }">
                <span :class="item.runningBalance >= 0 ? 'text-success' : 'text-error'">
                  {{ formatCurrency(item.runningBalance) }}
                </span>
              </template>
              <template #no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  لا توجد حركات لهذا الحساب في الفترة المحددة
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </template>
      <template v-else-if="!loading && !errorMsg && !entries.length">
        <v-card elevation="0" variant="flat" class="border" rounded="lg">
          <EmptyState
            icon="mdi-book-open-variant"
            title="لا توجد حركات"
            description="لا توجد حركات لهذا الحساب في الفترة المحددة"
          />
        </v-card>
      </template>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAccountingHelpers } from '@/composables/useAccountingHelpers';
import { useCurrency } from '@/composables/useCurrency';
import { formatDate } from '@/utils/formatters';
import type { Account } from '@/types/domain';
import type { LedgerEntry } from '@/api/endpoints/accounting';
import { EmptyState } from '@/components/common';

const route = useRoute();
const router = useRouter();
const accountingStore = useAccountingStore();
const { accountTypeLabel, accountTypeColor } = useAccountingHelpers();
const { formatCurrency } = useCurrency();

const loading = ref(false);
const errorMsg = ref<string | null>(null);
const entries = ref<LedgerEntry[]>([]);
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);

const accountId = computed(() => Number(route.params.accountId));

const ledgerSubtitle = computed(() => {
  const base = 'عرض دفتر الأستاذ العام';
  if (account.value) {
    return `${base} للحساب ${account.value.code}`;
  }
  return base;
});

const account = computed<Account | undefined>(() =>
  accountingStore.accounts.find((a) => a.id === accountId.value)
);

const headers = [
  { title: 'التاريخ', key: 'entryDate', width: 120 },
  { title: 'رقم القيد', key: 'entryNumber', width: 120 },
  { title: 'الوصف', key: 'description' },
  { title: 'مدين', key: 'debit', align: 'end' as const, width: 130 },
  { title: 'دائن', key: 'credit', align: 'end' as const, width: 130 },
  { title: 'الرصيد', key: 'runningBalance', align: 'end' as const, width: 140 },
];

const totalDebit = computed(() => entries.value.reduce((sum, e) => sum + (e.debit || 0), 0));
const totalCredit = computed(() => entries.value.reduce((sum, e) => sum + (e.credit || 0), 0));
const closingBalance = computed(() => {
  if (entries.value.length === 0) return 0;
  return entries.value[entries.value.length - 1].runningBalance;
});

async function loadLedger() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const result = await accountingStore.fetchAccountLedger(accountId.value, {
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    });
    if (result.ok) {
      entries.value = result.data;
    } else {
      errorMsg.value = result.error.message;
    }
  } catch {
    errorMsg.value = 'فشل في تحميل دفتر الأستاذ';
  } finally {
    loading.value = false;
  }
}

function goToEntry(entryId: number) {
  void router.push({ name: 'JournalEntryDetail', params: { id: entryId } });
}

onMounted(async () => {
  await accountingStore.fetchAccounts();
  await loadLedger();
});
</script>

<style scoped>
.gl-kpi-card {
  transition: box-shadow 0.2s ease;
}
.gl-kpi-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
</style>
