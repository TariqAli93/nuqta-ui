<template>
  <PageShell>
    <PageHeader :title="t('hr.payroll.details')" :subtitle="payrollRun?.title ?? ''" show-back back-to="/hr/payroll">
      <template #actions>
        <v-btn
          v-if="payrollRun?.status === 'draft'"
          variant="tonal"
          size="small"
          :to="`/hr/payroll/${route.params.id}/edit`"
          prepend-icon="mdi-pencil"
        >
          {{ t('common.edit') }}
        </v-btn>
        <v-btn
          v-if="payrollRun?.status === 'draft'"
          variant="tonal"
          color="info"
          size="small"
          prepend-icon="mdi-send"
          :loading="store.loading"
          @click="handleSubmit"
        >
          {{ t('payroll.submitAction') }}
        </v-btn>
        <v-btn
          v-if="payrollRun?.status === 'submitted' && canApprove"
          variant="tonal"
          color="success"
          size="small"
          prepend-icon="mdi-check-all"
          :loading="store.loading"
          @click="handleApprove"
        >
          {{ t('payroll.statusApproved') }}
        </v-btn>
        <v-btn
          v-if="payrollRun?.status === 'approved' && canApprove"
          variant="tonal"
          color="primary"
          size="small"
          prepend-icon="mdi-cash-multiple"
          :loading="store.loading"
          @click="handleDisburse"
        >
          {{ t('payroll.disburseAction') }}
        </v-btn>
        <v-btn
          v-if="
            payrollRun?.status &&
            payrollRun.status !== 'cancelled' &&
            payrollRun.status !== 'disbursed'
          "
          variant="tonal"
          color="error"
          size="small"
          prepend-icon="mdi-close-circle"
          :loading="store.loading"
          @click="confirmCancel = true"
        >
          {{ t('payroll.cancelAction') }}
        </v-btn>
      </template>
    </PageHeader>

    <v-progress-linear v-if="store.loading" indeterminate color="primary" />

    <v-card v-if="payrollRun" elevation="0" variant="flat" class="border mb-4" rounded="lg">
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('hr.payroll.runTitle') }}</div>
            <div class="text-body-1 font-weight-medium">{{ payrollRun.title }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('common.status') }}</div>
            <StatusBadge :status="payrollRun.status ?? 'draft'" />
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">
              {{ t('hr.payroll.periodStart') }}
            </div>
            <div>{{ payrollRun.periodStart }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('hr.payroll.periodEnd') }}</div>
            <div>{{ payrollRun.periodEnd }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('common.total') }}</div>
            <div class="font-weight-bold text-h6">
              {{
                payrollRun.totalAmount != null
                  ? formatNumber(payrollRun.totalAmount)
                  : t('common.none')
              }}
            </div>
          </v-col>
          <v-col v-if="payrollRun.notes" cols="12">
            <div class="text-caption text-medium-emphasis">{{ t('common.notes') }}</div>
            <div>{{ payrollRun.notes }}</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Payroll entries table -->
    <v-card v-if="payrollRun?.entries?.length" elevation="0" variant="flat" class="border" rounded="lg">
      <v-card-title class="pa-4">{{ t('hr.payroll.entries') }}</v-card-title>
      <v-card-text class="pa-0">
        <v-data-table
          :headers="entryHeaders"
          :items="payrollRun.entries"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :hide-default-footer="true"
        >
          <template #item.basicSalary="{ item }">
            {{ formatNumber(item.basicSalary) }}
          </template>
          <template #item.allowances="{ item }">
            {{ formatNumber(item.allowances ?? 0) }}
          </template>
          <template #item.deductions="{ item }">
            {{ formatNumber(item.deductions ?? 0) }}
          </template>
          <template #item.netSalary="{ item }">
            <span class="font-weight-bold">{{ formatNumber(item.netSalary) }}</span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <EmptyState
      v-if="!payrollRun && !store.loading"
      icon="mdi-cash-remove"
      :title="t('hr.payroll.notFound')"
      :description="t('hr.payroll.notFoundHint')"
      :action-label="t('hr.payroll.title')"
      action-to="/hr/payroll"
      action-icon="mdi-arrow-right"
    />

    <v-dialog v-model="confirmCancel" max-width="400" class="ds-dialog">
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-title>{{ t('hr.payroll.cancelConfirm') }}</v-card-title>
        <v-card-text>{{ t('hr.payroll.cancelHint') }}</v-card-text>
        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn variant="text" @click="confirmCancel = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" :loading="store.loading" @click="handleCancel">
            {{ t('payroll.cancelAction') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { mapErrorToArabic, t } from '@/i18n/t';
import { usePayrollStore } from '@/stores/payrollStore';
import { useRBAC } from '@/composables/useRBAC';
import type { PayrollRun } from '@/types/domain';
import EmptyState from '@/components/common/EmptyState.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { notifyError, notifySuccess } from '@/utils/notify';

const store = usePayrollStore();
const route = useRoute();
const router = useRouter();
const { can } = useRBAC();

const payrollRun = ref<PayrollRun | null>(null);
const confirmCancel = ref(false);
const canApprove = computed(() => can('payroll:approve'));

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'payroll-details-error' });
});

const entryHeaders = computed(() => [
  { title: t('common.name'), key: 'employeeName' },
  { title: t('hr.payroll.basicSalary'), key: 'basicSalary' },
  { title: t('hr.payroll.allowances'), key: 'allowances' },
  { title: t('hr.payroll.deductions'), key: 'deductions' },
  { title: t('hr.payroll.netSalary'), key: 'netSalary' },
]);

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-IQ').format(value);
}

async function loadPayrollRun() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.fetchPayrollRunById(id);
  if (result.ok && result.data) {
    payrollRun.value = result.data;
  }
}

async function handleSubmit() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.submitPayrollRun(id);
  if (result.ok) {
    notifySuccess(t('payroll.submitAction'));
    await loadPayrollRun();
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
  }
}

async function handleApprove() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.approvePayrollRun(id);
  if (result.ok) {
    notifySuccess(t('payroll.statusApproved'));
    await loadPayrollRun();
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
  }
}

async function handleDisburse() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.disbursePayrollRun(id);
  if (result.ok) {
    notifySuccess(t('payroll.disburseAction'));
    await loadPayrollRun();
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
  }
}

async function handleCancel() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.cancelPayrollRun(id);
  if (result.ok) {
    notifySuccess(t('payroll.cancelAction'));
    confirmCancel.value = false;
    await loadPayrollRun();
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.unexpected'));
    confirmCancel.value = false;
  }
}

onMounted(() => {
  void loadPayrollRun();
});
</script>
