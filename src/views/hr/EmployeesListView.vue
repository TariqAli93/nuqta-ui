<template>
  <div class="nq-page">
    <PageHeader :title="t('hr.employees.title')" :subtitle="t('hr.employees.subtitle')">
      <template #actions>
        <v-btn color="primary" :to="'/hr/employees/new'" prepend-icon="mdi-plus">
          {{ t('hr.employees.new') }}
        </v-btn>
      </template>
    </PageHeader>

    <v-card class="nq-table-card">
      <div class="nq-filter-bar">
        <v-text-field
          v-model="searchQuery"
          :placeholder="t('hr.employees.search')"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          style="flex: 1 1 280px; min-width: 180px"
        />
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          :label="t('common.status')"
          clearable
          hide-details
          style="flex: 0 1 200px; min-width: 160px"
        />
      </div>

      <v-data-table
        :headers="tableHeaders"
        :items="store.items"
        density="comfortable"
      >
        <template #item.fullName="{ item }">
          <span class="font-weight-medium">{{ item.fullName }}</span>
        </template>
        <template #item.phone="{ item }">
          <span class="text-medium-emphasis">{{ item.phone || t('common.none') }}</span>
        </template>
        <template #item.designation="{ item }">
          <span class="text-medium-emphasis">{{ item.designation || t('common.none') }}</span>
        </template>
        <template #item.status="{ item }">
          <StatusBadge :status="item.status ?? 'active'" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              size="small"
              variant="text"
              :to="`/hr/employees/${item.id}`"
              prepend-icon="mdi-eye"
            >
              {{ t('common.details') }}
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              :to="`/hr/employees/${item.id}/edit`"
              prepend-icon="mdi-pencil"
            >
              {{ t('common.edit') }}
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <EmptyState
        v-if="store.items.length === 0 && !store.loading"
        icon="mdi-account-group-outline"
        :title="t('hr.employees.noEmployees')"
        :description="t('hr.employees.noEmployeesHint')"
        :action-label="t('hr.employees.new')"
        action-to="/hr/employees/new"
        action-icon="mdi-plus"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { mapErrorToArabic, t } from '../../i18n/t';
import { useEmployeesStore } from '../../stores/employeesStore';
import EmptyState from '@/components/common/EmptyState.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { notifyError } from '@/utils/notify';

const store = useEmployeesStore();
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

const statusOptions = [
  { title: t('hr.employees.statusActive'), value: 'active' },
  { title: t('hr.employees.statusInactive'), value: 'inactive' },
  { title: t('hr.employees.statusTerminated'), value: 'terminated' },
  { title: t('hr.employees.statusOnLeave'), value: 'on_leave' },
];

const tableHeaders = computed(() => [
  { title: t('common.name'), key: 'fullName' },
  { title: t('common.phone'), key: 'phone' },
  { title: t('hr.employees.designation'), key: 'designation' },
  { title: t('common.status'), key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 200 },
]);

function fetchWithSearch() {
  void store.fetchEmployees({
    limit: 25,
    offset: 0,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
  });
}

watch([searchQuery, statusFilter], () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchWithSearch, 300);
});

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'employees-list-error' });
});

onMounted(() => {
  fetchWithSearch();
});
</script>
