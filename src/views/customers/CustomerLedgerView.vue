<template>
  <PageShell>
    <PageHeader title="دفتر العملاء (حسابات القبض)" subtitle="كشف حسابات العملاء والمطابقة المالية">
      <template #actions>
        <v-btn
          class="win-btn"
          variant="tonal"
          color="warning"
          :loading="ledgerStore.loading.reconciliation"
          prepend-icon="mdi-scale-balance"
          @click="ledgerStore.reconcileCustomerDebt(false)"
        >
          مطابقة AR
        </v-btn>
      </template>
    </PageHeader>

    <v-row dense>
      <v-col cols="4">
        <!-- Step 1: Select Customer -->
        <AppCard>
          <v-card-text>
            <v-row dense align="center">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="customerSearch"
                  prepend-inner-icon="mdi-magnify"
                  label="بحث عن عميل..."
                  density="compact"
                  hide-details
                  variant="outlined"
                  clearable
                  @update:model-value="searchCustomers"
                />
              </v-col>
            </v-row>
          </v-card-text>

          <v-data-table
            :headers="customerHeaders"
            :items="ledgerStore.customers"
            :loading="ledgerStore.loading.customers"
            density="comfortable"
            class="ds-table-enhanced ds-table-striped"
            :items-per-page="15"
            @click:row="onSelectCustomer"
          >
            <template #item.name="{ item }">
              <span
                :class="{
                  'font-weight-bold text-primary': ledgerStore.selectedCustomerId === item.id,
                }"
              >
                {{ item.name }}
              </span>
            </template>
            <template #item.totalDebt="{ item }">
              {{ formatMoney(item.totalDebt || 0) }}
            </template>
            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">لا يوجد عملاء</div>
            </template>
          </v-data-table>
        </AppCard>
      </v-col>

      <v-col cols="8">
        <template v-if="ledgerStore.selectedCustomerId">
          <v-row class="mb-3">
            <v-col cols="6">
              <StatCard
                icon="mdi-account"
                label="العميل"
                :value="selectedCustomerName"
                color="primary"
                size="sm"
              />
            </v-col>
            <v-col cols="6">
              <StatCard
                icon="mdi-cash-clock"
                :label="
                  (selectedCustomerLedgerBalance ?? 0) < 0 ? 'رصيد دائن (سلفة)' : 'الرصيد المستحق'
                "
                :color="(selectedCustomerLedgerBalance ?? 0) > 0 ? 'error' : 'success'"
                size="sm"
                :value="formatMoney(Math.abs(selectedCustomerLedgerBalance ?? 0))"
              />
            </v-col>
          </v-row>

          <!-- Filters -->
          <AppCard class="mb-3">
            <v-card-text class="flex flex-wrap gap-3">
              <AppDateInput
                v-model="ledgerDateFrom"
                label="من تاريخ"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                class="grow"
              />
              <AppDateInput
                v-model="ledgerDateTo"
                label="إلى تاريخ"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                class="grow"
              />
              <v-btn
                class="win-btn"
                color="primary"
                variant="tonal"
                :loading="ledgerStore.loading.customerLedger"
                prepend-icon="mdi-refresh"
                @click="reloadLedger"
              >
                تحديث
              </v-btn>
            </v-card-text>
          </AppCard>

          <!-- Step 3: Ledger Table -->
          <LedgerTable
            :entries="customerLedgerRows"
            :loading="ledgerStore.loading.customerLedger"
            entity-type="customer"
          />
        </template>
        <v-alert
          v-else
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
        >
          اختر عميلاً من القائمة أعلاه لعرض كشف حسابه
        </v-alert>
      </v-col>
    </v-row>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { AppCard, StatCard } from '@/components/common';
import { formatMoney } from '@/utils/formatters';
import { useLedgerStore } from '@/stores/ledgerStore';
import LedgerTable from '@/components/shared/LedgerTable.vue';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import type { LedgerEntry } from '@/components/shared/LedgerTable.vue';

const route = useRoute();
const ledgerStore = useLedgerStore();

const customerSearch = ref('');
const ledgerDateFrom = ref<string | null>(null);
const ledgerDateTo = ref<string | null>(null);

const customerHeaders = [
  { title: 'العميل', key: 'name' },
  { title: 'الهاتف', key: 'phone', width: 120 },
  { title: 'الرصيد', key: 'totalDebt', align: 'end' as const, width: 120 },
];

const customerLedgerRows = computed(
  () => ledgerStore.customerLedgerEntries as unknown as LedgerEntry[]
);

const selectedCustomerName = computed(() => {
  const c = ledgerStore.customers.find(
    (c: { id?: number }) => c.id === ledgerStore.selectedCustomerId
  );
  return c?.name ?? '—';
});

/**
 * Customer balance derived from ledger entries (running balance) — NOT from
 * customer.totalDebt which may be stale. Falls back to customer.totalDebt
 * only when no ledger entries are loaded yet.
 */
const selectedCustomerLedgerBalance = computed(() => {
  if (ledgerStore.customerLedgerEntries.length > 0) {
    // API returns entries newest-first; first entry holds the current running balance.
    return ledgerStore.customerLedgerEntries[0].balanceAfter;
  }
  const c = ledgerStore.customers.find(
    (c: { id?: number }) => c.id === ledgerStore.selectedCustomerId
  );
  return c?.totalDebt ?? 0;
});

async function onSelectCustomer(_event: Event, payload: { item: { id: number } }): Promise<void> {
  if (!payload.item.id) return;
  await ledgerStore.fetchCustomerLedger(payload.item.id, {
    dateFrom: ledgerDateFrom.value || undefined,
    dateTo: ledgerDateTo.value || undefined,
    limit: 100,
    offset: 0,
  });
}

async function reloadLedger(): Promise<void> {
  if (!ledgerStore.selectedCustomerId) return;
  await ledgerStore.fetchCustomerLedger(ledgerStore.selectedCustomerId, {
    dateFrom: ledgerDateFrom.value || undefined,
    dateTo: ledgerDateTo.value || undefined,
    limit: 100,
    offset: 0,
  });
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function searchCustomers(): void {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    void ledgerStore.fetchCustomers({
      search: customerSearch.value || undefined,
      limit: 200,
      offset: 0,
    });
  }, 300);
}

onMounted(async () => {
  await ledgerStore.fetchCustomers({ limit: 200, offset: 0 });

  const routeId = Number(route.params.id);
  if (routeId > 0) {
    await ledgerStore.fetchCustomerLedger(routeId, { limit: 100, offset: 0 });
  }
});
</script>
