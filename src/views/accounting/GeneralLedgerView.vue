<template>
  <v-container>
    <v-app-bar class="mb-6" border="bottom">
      <v-app-bar-title>
        <div class="win-title mb-0">{{ account ? account.name : '' }}</div>
        <div class="text-sm">
          عرض دفتر الأستاذ العام
          <span v-if="account">للحساب {{ account.code }}</span>
        </div>
      </v-app-bar-title>

      <template #prepend>
        <v-btn icon="mdi-arrow-right" variant="text" @click="goBack" />
      </template>
    </v-app-bar>

    <!-- Account header -->
    <v-card class="mb-4">
      <v-card-text class="d-flex align-center ga-4 flex-wrap">
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

        <v-text-field
          v-model="dateFrom"
          type="date"
          label="من تاريخ"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 180px"
          clearable
        />
        <v-text-field
          v-model="dateTo"
          type="date"
          label="إلى تاريخ"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 180px"
          clearable
        />
        <v-btn color="primary" variant="tonal" :loading="loading" @click="loadLedger"> عرض </v-btn>
      </v-card-text>
    </v-card>

    <!-- Error -->
    <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable>
      {{ errorMsg }}
    </v-alert>

    <!-- Ledger table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="entries"
        :loading="loading"
        density="compact"
        :items-per-page="25"
        :items-per-page-options="[10, 25, 50, 100]"
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
          <span v-if="item.credit" class="text-success">{{ formatCurrency(item.credit) }}</span>
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

        <template #bottom>
          <v-divider />
          <v-row dense class="px-4 py-3" v-if="entries.length > 0">
            <v-col class="text-end font-weight-bold">
              إجمالي المدين: {{ formatCurrency(totalDebit) }}
            </v-col>
            <v-col class="text-end font-weight-bold">
              إجمالي الدائن: {{ formatCurrency(totalCredit) }}
            </v-col>
            <v-col class="text-end font-weight-bold">
              الرصيد الختامي: {{ formatCurrency(closingBalance) }}
            </v-col>
          </v-row>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAccountingHelpers } from '@/composables/useAccountingHelpers';
import { useCurrency } from '@/composables/useCurrency';
import { formatDate } from '@/utils/formatters';
import type { Account } from '@/types/domain';
import type { LedgerEntry } from '@/api/endpoints/accounting';

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

function goBack() {
  void router.push({ name: 'AccountingAccounts' });
}

onMounted(async () => {
  await accountingStore.fetchAccounts();
  await loadLedger();
});
</script>
