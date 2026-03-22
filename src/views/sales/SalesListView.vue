<template>
  <div class="nq-page">
    <PageHeader :title="t('sales.title')" :subtitle="t('sales.subtitle')">
      <template #actions>
        <v-btn color="primary" :to="'/sales/new'" prepend-icon="mdi-plus">
          {{ t('sales.new') }}
        </v-btn>
      </template>
    </PageHeader>

    <v-card class="nq-section">
      <div class="nq-filter-bar">
        <v-text-field
          v-model="searchQuery"
          :placeholder="t('sales.search')"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          style="flex: 1 1 280px; min-width: 180px"
        />
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          :label="t('sales.filterByStatus')"
          clearable
          hide-details
          style="flex: 0 1 220px; min-width: 160px"
        />
      </div>

      <v-data-table
        :headers="tableHeaders"
        :items="filteredSales"
        density="comfortable"
      >
        <template #item.invoiceNumber="{ item }">
          <span class="font-weight-medium">{{ item.invoiceNumber }}</span>
        </template>
        <template #item.customerId="{ item }">
          <span v-if="item.customerId" class="text-medium-emphasis">
            {{ fetchCustomerName(item.customerId) }}
          </span>
          <span v-else class="text-disabled">{{ t('common.noCustomer') }}</span>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.total) }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusBadgeClass(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            :to="`/sales/${item.id}`"
            prepend-icon="mdi-eye"
          >
            {{ t('common.details') }}
          </v-btn>
        </template>
      </v-data-table>

      <EmptyState
        v-if="filteredSales.length === 0 && !store.loading"
        icon="mdi-receipt-text-outline"
        :title="t('sales.noSales')"
        :description="t('sales.noSalesHint')"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useSalesStore } from '@/stores/salesStore';
import EmptyState from '@/components/common/EmptyState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { useCurrency } from '@/composables/useCurrency';
import { notifyError } from '@/utils/notify';
import { useCustomersStore } from '@/stores/customersStore';

const store = useSalesStore();
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const { fetchCustomers, items: customers } = useCustomersStore();

const { formatCurrency } = useCurrency();

const statusOptions = computed(() => [
  { title: t('sales.pending'), value: 'pending' },
  { title: t('sales.completed'), value: 'completed' },
  { title: t('sales.cancelled'), value: 'cancelled' },
  { title: t('sales.refunded'), value: 'refunded' },
  { title: t('sales.partialRefund'), value: 'partial_refund' },
]);

const filteredSales = computed(() => {
  let result = store.items;
  const query = (searchQuery.value || '').trim().toLowerCase();

  if (query) {
    result = result.filter(
      (sale: any) =>
        sale.invoiceNumber?.toLowerCase().includes(query) ||
        String(sale.customerId ?? '').includes(query)
    );
  }

  if (statusFilter.value) {
    result = result.filter((sale: any) => sale.status === statusFilter.value);
  }

  return result;
});

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

const tableHeaders = computed(() => [
  { title: t('sales.invoice'), key: 'invoiceNumber' },
  { title: t('sales.customer'), key: 'customerId' },
  { title: t('sales.total'), key: 'total' },
  { title: t('sales.status'), key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 120 },
]);

function statusLabel(status: string | undefined): string {
  if (!status) return t('common.none');
  const value = t(`enum.saleStatus.${status}`);
  return value === t('errors.undefinedText') ? t('common.none') : value;
}

function statusBadgeClass(status: string | undefined): string {
  const statusMap: Record<string, string> = {
    completed: 'success',
    pending: 'warning',
    cancelled: 'error',
    refunded: 'info',
    hold: 'warning',
  };
  return (status && statusMap[status]) || 'default';
}

function fetchWithFilters() {
  void store.fetchSales({
    limit: 25,
    offset: 0,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
  });
}

const fetchCustomerName = computed(() => {
  const map: Record<number, string> = {};
  customers.map((c) => {
    if (c.id && c.name) map[c.id] = c.name;
  });
  return (id: number) => map[id] || t('common.unknown');
});

watch([searchQuery, statusFilter], () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchWithFilters, 300);
});

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'sales-list-error' });
});

onMounted(() => {
  fetchWithFilters();
  fetchCustomers();
});

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>
