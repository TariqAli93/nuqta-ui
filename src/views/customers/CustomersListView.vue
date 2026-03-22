<template>
  <div class="nq-page">
    <PageHeader :title="t('customers.title')" :subtitle="t('customers.subtitle')">
      <template #actions>
        <v-btn color="primary" :to="'/customers/new'" prepend-icon="mdi-plus">
          {{ t('customers.new') }}
        </v-btn>
      </template>
    </PageHeader>

    <v-card class="nq-table-card">
      <div class="nq-filter-bar">
        <v-text-field
          v-model="searchQuery"
          :placeholder="t('customers.search')"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          style="flex: 1 1 320px; min-width: 200px"
        />
      </div>

      <v-data-table
        :headers="tableHeaders"
        :items="store.items"
        density="comfortable"
      >
        <template #item.name="{ item }">
          <span class="font-weight-medium">{{ item.name }}</span>
        </template>
        <template #item.phone="{ item }">
          <span class="text-medium-emphasis">{{ item.phone || t('common.none') }}</span>
        </template>
        <template #item.city="{ item }">
          <span class="text-medium-emphasis">{{ item.city || t('common.none') }}</span>
        </template>
        <template #item.totalDebt="{ item }">
          <span
            class="font-weight-bold"
            :class="item.totalDebt && item.totalDebt > 0 ? 'text-error' : 'text-success'"
          >
            {{ formatNumber(item.totalDebt ?? 0) }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            :to="`/customers/${item.id}/edit`"
            prepend-icon="mdi-pencil"
          >
            {{ t('common.edit') }}
          </v-btn>
        </template>
      </v-data-table>

      <EmptyState
        v-if="store.items.length === 0 && !store.loading"
        icon="mdi-account-group-outline"
        :title="t('customers.noCustomers')"
        :description="t('customers.noCustomersHint')"
        :action-label="t('customers.new')"
        action-to="/customers/new"
        action-icon="mdi-plus"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { mapErrorToArabic, t } from '../../i18n/t';
import { useCustomersStore } from '../../stores/customersStore';
import EmptyState from '@/components/common/EmptyState.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { notifyError } from '@/utils/notify';

const store = useCustomersStore();
const searchQuery = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

const tableHeaders = computed(() => [
  { title: t('common.name'), key: 'name' },
  { title: t('common.phone'), key: 'phone' },
  { title: t('common.city'), key: 'city' },
  { title: t('customers.totalDebt'), key: 'totalDebt' },
  { title: '', key: 'actions', sortable: false, width: 120 },
]);

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-IQ').format(value);
}

function fetchWithSearch() {
  void store.fetchCustomers({
    limit: 25,
    offset: 0,
    search: searchQuery.value || undefined,
  });
}

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchWithSearch, 300);
});

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'customers-list-error' });
});

onMounted(() => {
  fetchWithSearch();
});
</script>
