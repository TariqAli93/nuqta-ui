<template>
  <v-container>
    <div class="win-page">
      <v-app-bar class="ds-page-header d-flex align-center justify-space-between mb-6">
        <template #prepend>
          <v-btn icon="mdi-arrow-right" variant="text" @click="router.back()" />
        </template>
        <v-app-bar-title>
          <div class="win-title mb-0">
            {{ isEdit ? t('hr.payroll.edit') : t('hr.payroll.new') }}
          </div>
          <div class="text-sm">{{ t('hr.payroll.formHint') }}</div>
        </v-app-bar-title>
      </v-app-bar>

      <v-card class="win-card win-card--padded" flat>
        <v-form class="win-form" @submit.prevent="submit">
          <v-text-field v-model="form.title" :label="t('hr.payroll.runTitle')" required />
          <div class="d-flex flex-wrap ga-2">
            <v-text-field
              v-model="form.periodStart"
              :label="t('hr.payroll.periodStart')"
              type="date"
              required
            />
            <v-text-field
              v-model="form.periodEnd"
              :label="t('hr.payroll.periodEnd')"
              type="date"
              required
            />
          </div>
          <v-textarea v-model="form.notes" :label="t('common.notes')" rows="3" />

          <div class="d-flex ga-2">
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              class="win-btn"
              :loading="store.loading"
            >
              {{ t('common.save') }}
            </v-btn>
            <v-btn variant="text" class="win-ghost-btn" to="/hr/payroll">
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mapErrorToArabic, t } from '../../i18n/t';
import { usePayrollStore } from '../../stores/payrollStore';
import type { PayrollRunInput } from '../../types/domain';
import { notifyError, notifySuccess } from '@/utils/notify';

const store = usePayrollStore();
const route = useRoute();
const router = useRouter();

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.unexpected') : null
);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'payroll-form-error' });
});

const idParam = computed(() => route.params.id);
const isEdit = computed(() => typeof idParam.value === 'string');

const form = reactive<PayrollRunInput>({
  title: '',
  periodStart: '',
  periodEnd: '',
  notes: null,
});

async function loadPayrollRun() {
  if (!isEdit.value) return;
  const id = Number(idParam.value);
  if (Number.isNaN(id)) return;
  const result = await store.fetchPayrollRunById(id);
  if (result.ok && result.data) {
    form.title = result.data.title;
    form.periodStart = result.data.periodStart;
    form.periodEnd = result.data.periodEnd;
    form.notes = result.data.notes ?? null;
  }
}

async function submit() {
  if (isEdit.value) {
    const id = Number(idParam.value);
    if (Number.isNaN(id)) return;
    const result = await store.updatePayrollRun(id, form);
    if (result.ok) {
      notifySuccess(t('common.saved'));
      await router.push('/hr/payroll');
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
    }
    return;
  }

  const result = await store.createPayrollRun(form);
  if (result.ok) {
    notifySuccess(t('common.saved'));
    await router.push('/hr/payroll');
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
  }
}

onMounted(() => {
  void loadPayrollRun();
});
</script>
