<template>
  <PageShell>
    <PageHeader :title="t('customers.title')" :subtitle="t('customers.subtitle')">
      <template #actions>
        <v-btn color="primary" :to="'/customers/new'" prepend-icon="mdi-plus">
          {{ t('customers.new') }}
        </v-btn>
      </template>
    </PageHeader>

    <FilterBar>
      <v-text-field
        v-model="searchQuery"
        :placeholder="t('customers.search')"
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        clearable
        autofocus
        hide-details
      />
    </FilterBar>

    <v-card class="border" elevation="0" variant="flat" rounded="lg">
      <v-card-text class="pa-0">
        <v-data-table
          :headers="tableHeaders"
          :items="store.items"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :no-data-text="''"
          :hide-default-footer="true"
          @click:row="(_: Event, { item }: { item: any }) => router.push(`/customers/${item.id}`)"
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
              {{ formatMoney(item.totalDebt ?? 0) }}
            </span>
          </template>
          <template #item.actions="{ item }">
            <v-menu location="bottom end">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  @click.stop
                />
              </template>
              <v-list density="compact" min-width="160">
                <v-list-item
                  :to="`/customers/${item.id}`"
                  prepend-icon="mdi-eye"
                  :title="t('customers.view')"
                />
                <v-list-item
                  :to="`/customers/${item.id}/edit`"
                  prepend-icon="mdi-pencil"
                  :title="t('customers.edit')"
                />
              </v-list>
            </v-menu>
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
      </v-card-text>
    </v-card>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { PageShell, PageHeader, FilterBar } from '@/components/layout';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useCustomersStore } from '@/stores/customersStore';
import { EmptyState } from '@/components/common';
import { notifyError } from '@/utils/notify';
import { formatMoney } from '@/utils/formatters';

const router = useRouter();
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
