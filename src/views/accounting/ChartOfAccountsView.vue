<template>
  <v-card flat>
    <!-- Toolbar -->
    <v-toolbar flat density="compact" color="transparent" class="px-2">
      <v-text-field
        v-model="search"
        density="compact"
        variant="outlined"
        hide-details
        prepend-inner-icon="mdi-magnify"
        placeholder="بحث بالاسم أو الكود..."
        clearable
        class="me-3"
        style="max-width: 280px"
      />

      <v-select
        v-model="filterType"
        :items="accountTypeOptions"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        placeholder="تصفية حسب النوع"
        class="me-3"
        style="max-width: 200px"
      />

      <v-spacer />

      <v-btn
        size="small"
        variant="flat"
        color="primary"
        prepend-icon="mdi-plus"
        class="me-2"
        @click="accountFormDialog?.open()"
      >
        إضافة حساب
      </v-btn>

      <v-chip variant="tonal" size="small" class="me-2">
        {{ filteredAccounts.length }} حساب
      </v-chip>

      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="accountingStore.loading"
        @click="refresh"
      />
    </v-toolbar>

    <v-divider />

    <!-- Error State -->
    <v-alert
      v-if="accountingStore.error && !accountingStore.loading"
      type="error"
      variant="tonal"
      class="ma-4"
      closable
    >
      {{ accountingStore.error }}
      <template #append>
        <v-btn variant="text" size="small" @click="refresh">إعادة المحاولة</v-btn>
      </template>
    </v-alert>

    <!-- Data Table -->
    <v-data-table
      v-if="!accountingStore.error || accountingStore.accounts.length > 0"
      :headers="accountHeaders"
      :items="filteredAccounts"
      :loading="accountingStore.loading"
      :search="search ?? undefined"
      density="compact"
      :items-per-page="25"
      :items-per-page-options="[10, 25, 50, 100]"
      hover
      class="chart-of-accounts-table"
      @click:row="(_e: Event, { item }: { item: Account }) => onRowClick(item)"
    >
      <template #item.code="{ item }">
        <span
          :style="{ paddingInlineStart: getIndent(item) + 'px' }"
          class="font-weight-medium text-mono"
        >
          {{ item.code }}
        </span>
      </template>

      <template #item.name="{ item }">
        <span :class="{ 'font-weight-bold': isParentAccount(item) }">
          {{ item.name }}
        </span>
      </template>

      <template #item.accountType="{ item }">
        <v-chip size="x-small" variant="tonal" :color="accountTypeColor(item.accountType)">
          {{ accountTypeLabel(item.accountType) }}
        </v-chip>
      </template>

      <template #item.balance="{ item }">
        <span :class="balanceClass(item.balance ?? 0)">
          {{ formatCurrency(item.balance ?? 0) }}
        </span>
      </template>

      <template #item.actions="{ item }">
        <v-menu location="start">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="x-small" />
          </template>
          <v-list density="compact" min-width="160">
            <v-list-item
              prepend-icon="mdi-eye-outline"
              title="عرض التفاصيل"
              @click="navigateToAccount(item)"
            />
            <v-list-item
              prepend-icon="mdi-pencil-outline"
              title="تعديل"
              @click="accountFormDialog?.open(item)"
            />
            <v-list-item
              prepend-icon="mdi-book-open-page-variant-outline"
              title="دفتر الأستاذ"
              @click="navigateToLedger(item)"
            />
          </v-list>
        </v-menu>
      </template>

      <template #no-data>
        <empty-state
          v-if="!accountingStore.loading"
          icon="mdi-chart-timeline-variant-shimmer"
          :title="search || filterType ? 'لا توجد نتائج' : 'لا توجد حسابات'"
          :description="
            search || filterType
              ? 'لا توجد حسابات مطابقة لمعايير البحث الحالية'
              : 'لم يتم تهيئة دليل الحسابات بعد'
          "
        />
      </template>
    </v-data-table>
    <AccountFormDialog ref="accountFormDialog" />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAccountingHelpers } from '@/composables/useAccountingHelpers';
import { useCurrency } from '@/composables/useCurrency';
import type { Account } from '@/types/domain';
import EmptyState from '@/components/common/EmptyState.vue';
import AccountFormDialog from '@/components/workspace/AccountFormDialog.vue';

const router = useRouter();
const accountingStore = useAccountingStore();
const { accountTypeLabel, accountTypeColor } = useAccountingHelpers();
const { formatCurrency } = useCurrency();

const accountFormDialog = ref<InstanceType<typeof AccountFormDialog> | null>(null);

// ── Toolbar state ──────────────────────────────────────────
const search = ref<string | null>(null);
const filterType = ref<Account['accountType'] | null>(null);

const accountTypeOptions: { title: string; value: Account['accountType'] }[] = [
  { title: 'اصول', value: 'asset' },
  { title: 'التزامات', value: 'liability' },
  { title: 'حقوق ملكية', value: 'equity' },
  { title: 'إيرادات', value: 'revenue' },
  { title: 'مصاريف', value: 'expense' },
];

// ── Table headers ──────────────────────────────────────────
const accountHeaders: {
  title: string;
  key: string;
  align?: 'start' | 'end' | 'center';
  sortable?: boolean;
  width?: number | string;
}[] = [
  { title: 'الكود', key: 'code', width: 100, sortable: true },
  { title: 'الحساب', key: 'name', sortable: true },
  { title: 'النوع', key: 'accountType', width: 120, sortable: true },
  { title: 'الرصيد', key: 'balance', align: 'end', width: 150, sortable: true },
  { title: '', key: 'actions', width: 50, sortable: false },
];

// ── Filtered data ──────────────────────────────────────────
const filteredAccounts = computed(() => {
  let result = accountingStore.accounts;

  if (filterType.value) {
    result = result.filter((a) => a.accountType === filterType.value);
  }

  if (search.value) {
    const term = search.value.toLowerCase();
    result = result.filter(
      (a) => a.name.toLowerCase().includes(term) || a.code.toLowerCase().includes(term)
    );
  }

  return result;
});

// ── Hierarchy helpers ──────────────────────────────────────
function isParentAccount(account: Account): boolean {
  return accountingStore.accounts.some((a) => a.parentId === account.id);
}

function getIndent(account: Account): number {
  if (!account.parentId) return 0;
  let depth = 0;
  let current: Account | undefined = account;
  while (current?.parentId) {
    depth++;
    current = accountingStore.accounts.find((a) => a.id === current!.parentId);
  }
  return depth * 16;
}

// ── Balance display ────────────────────────────────────────
function balanceClass(balance: number): string {
  if (balance > 0) return 'text-success';
  if (balance < 0) return 'text-error';
  return 'text-medium-emphasis';
}

// ── Navigation ─────────────────────────────────────────────
function onRowClick(account: Account) {
  navigateToAccount(account);
}

function navigateToAccount(account: Account) {
  router.push({
    name: 'AccountLedger',
    params: { accountId: String(account.id) },
  });
}

function navigateToLedger(account: Account) {
  router.push({
    name: 'AccountLedger',
    params: { accountId: String(account.id) },
  });
}

// ── Data fetching ──────────────────────────────────────────
function refresh() {
  accountingStore.fetchAccounts(true);
}

onMounted(() => {
  accountingStore.fetchAccounts();
});
</script>

<style scoped>
.chart-of-accounts-table :deep(tr) {
  cursor: pointer;
}

.text-mono {
  font-family: 'Courier New', monospace;
}
</style>
