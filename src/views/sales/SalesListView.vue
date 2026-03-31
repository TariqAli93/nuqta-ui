<template>
  <PageShell>
    <PageHeader :title="t('sales.title')" :subtitle="t('sales.subtitle')">
      <template #actions>
        <v-btn class="win-btn" color="primary" :to="'/sales/new'" prepend-icon="mdi-plus">
          {{ t('sales.new') }}
        </v-btn>
      </template>
    </PageHeader>

    <FilterBar>
      <v-text-field
        v-model="searchQuery"
        :placeholder="t('sales.search')"
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        clearable
        autofocus
        hide-details
        class="grow"
        style="min-width: 200px"
      />
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        :label="t('sales.filterByStatus')"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        style="max-width: 200px"
      />
    </FilterBar>

    <v-card class="border" elevation="0" variant="flat" rounded="lg">
      <v-card-text class="pa-0">
        <v-data-table
          :headers="tableHeaders"
          :items="store.items"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :loading="store.loading"
        >
          <template #item.invoiceNumber="{ item }">
            <span class="font-weight-medium">{{ item.invoiceNumber }}</span>
          </template>
          <template #item.lineItems="{ item }">
            <span>{{ item?.items?.length }}</span>
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
          <template #item.discount="{ item }">
            <span class="font-weight-medium">{{ item.discount === 0 ? '—' : formatCurrency(Number(item.discount)) }}</span>
          </template>
          <template #item.tax="{ item }">
            <span class="font-weight-medium">{{ item.tax === 0 ? '—' : formatCurrency(Number(item.tax)) }}</span>
          </template>
          <template #item.status="{ item }">
            <v-chip size="small" variant="tonal" :color="statusBadgeClass(item.status)">
              {{ statusLabel(item.status) }}
            </v-chip>
          </template>
          <template #item.paymentStatus="{ item }">
            <v-chip
              v-if="item.paymentStatus"
              size="small"
              variant="tonal"
              :color="paymentStatusColor(item.paymentStatus as NonNullable<Sale['paymentStatus']>)"
            >
              {{ paymentStatusLabel(item.paymentStatus as NonNullable<Sale['paymentStatus']>) }}
            </v-chip>
            <span v-else class="text-disabled">—</span>
          </template>
          <template #item.createdAt="{ item }">
           {{ dateWithTime(item.createdAt) }} - ({{ formatDateRelative(item.createdAt) }})
          </template>
          <template #item.updatedAt="{ item }">
           {{ dateWithTime(item.updatedAt) }} - ({{ formatDateRelative(item.updatedAt) }})
          </template>
          <template #item.referenceNumber="{ item }">
            <span>{{ item.referenceNumber || '—' }}</span>
          </template>
          <template #item.paymentMethod="{ item }">
            <span>
              {{ item.paymentMethod ? t(`paymentMethods.${item.paymentMethod}`) : '—' }}
            </span>
          </template>

          <template #item.createdByWithUser="{ item }">
            <span>{{ item?.user?.fullName || t('common.unknown') }}</span>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="text"
              class="win-ghost-btn"
              :to="`/sales/${item.id}`"
              prepend-icon="mdi-eye"
            >
              {{ t('common.details') }}
            </v-btn>
          </template>
        </v-data-table>

        <EmptyState
          v-if="store.items.length === 0 && !store.loading"
          icon="mdi-receipt-text-outline"
          :title="t('sales.noSales')"
          :description="t('sales.noSalesHint')"
        />
      </v-card-text>
    </v-card>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { PageShell, PageHeader, FilterBar } from '@/components/layout';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useSalesStore } from '@/stores/salesStore';
import EmptyState from '@/components/common/EmptyState.vue';
import { useCurrency } from '@/composables/useCurrency';
import { notifyError } from '@/utils/notify';
import { useCustomersStore } from '@/stores/customersStore';
import { paymentStatusLabel, paymentStatusColor } from '@/types/invoice';
import type { Sale } from '@/types/domain';
import { formatDateRelative, dateWithTime } from '@/utils/formatters';

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

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);



const tableHeaders = computed(() => [
  { title: t('sales.invoice'),  key: 'invoiceNumber' },
  { title: t('sales.customer'),  key: 'customerId' },
  { title: t('sales.lineItems'),  key: 'lineItems' },
  { title: t('sales.total'),  key: 'total' },
  { title: t('sales.discount'),  key: 'discount' },
  { title: t('sales.tax'),  key: 'tax' },
  { title: t('sales.currency'),  key: 'currency' }, // نص غير معروف
  { title: t('sales.status'),  key: 'status' },
  { title: t('sales.paymentMethod'),  key: 'paymentMethod', sortable: true },
  { title: t('sales.referenceNumber'),  key: 'referenceNumber', sortable: false },
  {title: t('sales.dateTime'),  key: 'createdAt' },
  { title: t('common.updatedAt'),  key: 'updatedAt' },
  { title: t('sales.createdBy'),  key: 'createdByWithUser', sortable: true },
  { title: '',  key: 'actions', sortable: false, width: 120 },
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
  customers.forEach((c) => {
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
