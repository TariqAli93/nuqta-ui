<template>
  <PageShell>
    <PageHeader
      title="دفتر الموردين (حسابات الدفع)"
      subtitle="كشف حسابات الموردين والمطابقة المالية"
    >
      <template #actions>
        <v-btn
          class="win-btn"
          variant="tonal"
          color="warning"
          :loading="ledgerStore.loading.reconciliation"
          prepend-icon="mdi-scale-balance"
          @click="ledgerStore.reconcileSupplierBalance(false)"
        >
          مطابقة AP
        </v-btn>
      </template>
    </PageHeader>

    <v-row dense>
      <!-- Supplier selector -->
      <v-col cols="12" md="4">
        <AppCard>
          <v-card-text>
            <v-text-field
              v-model="supplierSearch"
              prepend-inner-icon="mdi-magnify"
              label="بحث عن مورد..."
              density="comfortable"
              hide-details
              variant="outlined"
              clearable
              @update:model-value="searchSuppliers"
            />
          </v-card-text>
          <v-data-table
            :headers="supplierHeaders"
            :items="ledgerStore.suppliers"
            :loading="ledgerStore.loading.suppliers"
            density="comfortable"
            class="ds-table-enhanced ds-table-striped"
            :items-per-page="15"
            @click:row="onSelectSupplier"
          >
            <template #item.name="{ item }">
              <span
                :class="{
                  'font-weight-bold text-primary': ledgerStore.selectedSupplierId === item.id,
                }"
              >
                {{ item.name }}
              </span>
            </template>
            <template #item.currentBalance="{ item }">
              {{ formatMoney(item.currentBalance || 0) }}
            </template>
            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">لا يوجد موردون</div>
            </template>
          </v-data-table>
        </AppCard>
      </v-col>

      <!-- Ledger detail -->
      <v-col cols="12" md="8">
        <template v-if="ledgerStore.selectedSupplierId">
          <v-row class="mb-3">
            <v-col cols="6">
              <StatCard
                icon="mdi-account"
                label="المورد"
                :value="selectedSupplierName"
                color="primary"
                size="sm"
              />
            </v-col>
            <v-col cols="6">
              <StatCard
                icon="mdi-cash-clock"
                label="الرصيد المستحق"
                :color="(selectedSupplierBalance ?? 0) > 0 ? 'error' : 'success'"
                size="sm"
                :value="formatMoney(Math.abs(selectedSupplierBalance ?? 0))"
              />
            </v-col>
          </v-row>

          <!-- Filters -->
          <AppCard class="mb-3">
            <v-card-text class="d-flex align-center ga-3 flex-wrap">
              <AppDateInput
                v-model="ledgerDateFrom"
                label="من تاريخ"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                class="grow"
                style="max-width: 180px"
              />
              <AppDateInput
                v-model="ledgerDateTo"
                label="إلى تاريخ"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                class="grow"
                style="max-width: 180px"
              />
              <v-btn
                class="win-btn"
                color="primary"
                variant="tonal"
                :loading="ledgerStore.loading.supplierLedger"
                prepend-icon="mdi-refresh"
                @click="reloadLedger"
              >
                تحديث
              </v-btn>
            </v-card-text>
          </AppCard>

          <!-- Ledger Table -->
          <LedgerTable
            :entries="supplierLedgerRows"
            :loading="ledgerStore.loading.supplierLedger"
            entity-type="supplier"
          />
        </template>
        <v-alert
          v-else
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-information-outline"
        >
          اختر مورداً من القائمة لعرض كشف حسابه
        </v-alert>
      </v-col>
    </v-row>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { formatMoney } from '@/utils/formatters';
import { PageShell, PageHeader } from '@/components/layout';
import { AppCard, StatCard } from '@/components/common';
import { useLedgerStore } from '@/stores/ledgerStore';
import LedgerTable from '@/components/shared/LedgerTable.vue';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import type { LedgerEntry } from '@/components/shared/LedgerTable.vue';

const ledgerStore = useLedgerStore();

const supplierSearch = ref('');
const ledgerDateFrom = ref<string | null>(null);
const ledgerDateTo = ref<string | null>(null);

const supplierHeaders = [
  { title: 'المورد', key: 'name' },
  { title: 'الهاتف', key: 'phone', width: 120 },
  { title: 'الرصيد', key: 'currentBalance', align: 'end' as const, width: 120 },
];

const supplierLedgerRows = computed(
  () => ledgerStore.supplierLedgerEntries as unknown as LedgerEntry[]
);

const selectedSupplier = computed(() =>
  ledgerStore.suppliers.find((s) => s.id === ledgerStore.selectedSupplierId)
);
const selectedSupplierName = computed(() => selectedSupplier.value?.name ?? '');
const selectedSupplierBalance = computed(() => selectedSupplier.value?.currentBalance ?? 0);

async function onSelectSupplier(_event: Event, payload: { item: { id: number } }): Promise<void> {
  if (!payload.item.id) return;
  await ledgerStore.fetchSupplierLedger(payload.item.id, {
    dateFrom: ledgerDateFrom.value || undefined,
    dateTo: ledgerDateTo.value || undefined,
    limit: 100,
    offset: 0,
  });
}

async function reloadLedger(): Promise<void> {
  if (!ledgerStore.selectedSupplierId) return;
  await ledgerStore.fetchSupplierLedger(ledgerStore.selectedSupplierId, {
    dateFrom: ledgerDateFrom.value || undefined,
    dateTo: ledgerDateTo.value || undefined,
    limit: 100,
    offset: 0,
  });
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function searchSuppliers(): void {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    void ledgerStore.fetchSuppliers({
      search: supplierSearch.value || undefined,
      limit: 200,
      offset: 0,
    });
  }, 300);
}

onMounted(async () => {
  await ledgerStore.fetchSuppliers({ limit: 200, offset: 0 });
});
</script>
