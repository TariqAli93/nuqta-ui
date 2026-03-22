<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('hr.departments.title') }}</div>
        <div class="text-sm text-medium-emphasis">{{ t('hr.departments.subtitle') }}</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn color="primary" size="small" :to="'/hr/departments/new'" prepend-icon="mdi-plus">
          {{ t('hr.departments.new') }}
        </v-btn>
      </div>
    </div>

    <v-card class="ds-filter-bar" flat>
      <v-card-text class="pa-4">
        <v-text-field
          v-model="searchQuery"
          :placeholder="t('hr.departments.search')"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
        />
      </v-card-text>
    </v-card>

    <v-card class="win-card" flat>
      <v-card-text class="pa-0">
        <v-data-table
          :headers="tableHeaders"
          :items="store.items"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :no-data-text="''"
          :hide-default-footer="true"
        >
          <template #item.name="{ item }">
            <span class="font-weight-medium">{{ item.name }}</span>
          </template>
          <template #item.description="{ item }">
            <span class="text-medium-emphasis">{{ item.description || t('common.none') }}</span>
          </template>
          <template #item.isActive="{ item }">
            <StatusBadge :status="item.isActive !== false ? 'active' : 'inactive'" />
          </template>
          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="text"
              class="win-ghost-btn"
              :to="`/hr/departments/${item.id}/edit`"
              prepend-icon="mdi-pencil"
            >
              {{ t('common.edit') }}
            </v-btn>
          </template>
        </v-data-table>

        <EmptyState
          v-if="store.items.length === 0 && !store.loading"
          icon="mdi-office-building-outline"
          :title="t('hr.departments.noDepartments')"
          :description="t('hr.departments.noDepartmentsHint')"
          :action-label="t('hr.departments.new')"
          action-to="/hr/departments/new"
          action-icon="mdi-plus"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { mapErrorToArabic, t } from '../../i18n/t';
import { useDepartmentsStore } from '../../stores/departmentsStore';
import EmptyState from '../../components/emptyState.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';
import { notifyError } from '@/utils/notify';

const store = useDepartmentsStore();
const searchQuery = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

const tableHeaders = computed(() => [
  { title: t('common.name'), key: 'name' },
  { title: t('common.description'), key: 'description' },
  { title: t('common.status'), key: 'isActive' },
  { title: '', key: 'actions', sortable: false, width: 120 },
]);

function fetchWithSearch() {
  void store.fetchDepartments({
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
  notifyError(value, { dedupeKey: 'departments-list-error' });
});

onMounted(() => {
  fetchWithSearch();
});
</script>

<style scoped></style>
