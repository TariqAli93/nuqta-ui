<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('hr.payroll.title') }}</div>
        <div class="text-sm text-medium-emphasis">{{ t('hr.payroll.subtitle') }}</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn color="primary" size="small" :to="'/hr/payroll/new'" prepend-icon="mdi-plus">
          {{ t('hr.payroll.new') }}
        </v-btn>
      </div>
    </div>

    <v-card class="ds-filter-bar" flat>
      <v-card-text class="pa-4">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          :label="t('common.status')"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          style="max-width: 250px"
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
          <template #item.title="{ item }">
            <span class="font-weight-medium">{{ item.title }}</span>
          </template>
          <template #item.periodStart="{ item }">
            <span class="text-medium-emphasis">{{ item.periodStart }}</span>
          </template>
          <template #item.periodEnd="{ item }">
            <span class="text-medium-emphasis">{{ item.periodEnd }}</span>
          </template>
          <template #item.totalAmount="{ item }">
            <span class="font-weight-bold">
              {{ item.totalAmount != null ? formatNumber(item.totalAmount) : t('common.none') }}
            </span>
          </template>
          <template #item.status="{ item }">
            <StatusBadge :status="item.status ?? 'draft'" />
          </template>
          <template #item.actions="{ item }">
            <v-btn
              size="small"
              variant="text"
              class="win-ghost-btn"
              :to="`/hr/payroll/${item.id}`"
              prepend-icon="mdi-eye"
            >
              {{ t('common.details') }}
            </v-btn>
          </template>
        </v-data-table>

        <EmptyState
          v-if="store.items.length === 0 && !store.loading"
          icon="mdi-cash-multiple"
          :title="t('hr.payroll.noPayrollRuns')"
          :description="t('hr.payroll.noPayrollRunsHint')"
          :action-label="t('hr.payroll.new')"
          action-to="/hr/payroll/new"
          action-icon="mdi-plus"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { mapErrorToArabic, t } from '../../i18n/t';
import { usePayrollStore } from '../../stores/payrollStore';
import EmptyState from '../../components/emptyState.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';
import { notifyError } from '@/utils/notify';

const store = usePayrollStore();
const statusFilter = ref<string | null>(null);

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

const statusOptions = [
  { title: t('payroll.statusDraft'), value: 'draft' },
  { title: t('payroll.statusSubmitted'), value: 'submitted' },
  { title: t('payroll.statusApproved'), value: 'approved' },
  { title: t('payroll.statusDisbursed'), value: 'disbursed' },
  { title: t('payroll.statusCancelled'), value: 'cancelled' },
];

const tableHeaders = computed(() => [
  { title: t('hr.payroll.runTitle'), key: 'title' },
  { title: t('hr.payroll.periodStart'), key: 'periodStart' },
  { title: t('hr.payroll.periodEnd'), key: 'periodEnd' },
  { title: t('common.total'), key: 'totalAmount' },
  { title: t('common.status'), key: 'status' },
  { title: '', key: 'actions', sortable: false, width: 120 },
]);

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-IQ').format(value);
}

function fetchPayroll() {
  void store.fetchPayrollRuns({
    limit: 25,
    offset: 0,
    status: statusFilter.value || undefined,
  });
}

watch(statusFilter, () => {
  fetchPayroll();
});

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'payroll-list-error' });
});

onMounted(() => {
  fetchPayroll();
});
</script>

<style scoped></style>
