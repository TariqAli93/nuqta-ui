<template>
  <v-container>
    <div class="win-page">
      <v-app-bar class="ds-page-header d-flex align-center justify-space-between mb-6">
        <template #prepend>
          <v-btn icon="mdi-arrow-right" variant="text" @click="router.back()" />
        </template>
        <v-app-bar-title>
          <div class="win-title mb-0">
            {{ isEdit ? t('hr.departments.edit') : t('hr.departments.new') }}
          </div>
          <div class="text-sm">{{ t('hr.departments.formHint') }}</div>
        </v-app-bar-title>
      </v-app-bar>

      <v-card class="win-card win-card--padded" flat>
        <v-form class="win-form" @submit.prevent="submit">
          <v-text-field v-model="form.name" :label="t('common.name')" required />
          <v-textarea v-model="form.description" :label="t('common.description')" rows="3" />
          <v-switch
            v-model="form.isActive"
            :label="form.isActive ? t('common.active') : t('common.inactive')"
            color="primary"
          />

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
            <v-btn variant="text" class="win-ghost-btn" to="/hr/departments">
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
import { useDepartmentsStore } from '../../stores/departmentsStore';
import type { DepartmentInput } from '../../types/domain';
import { notifyError, notifySuccess } from '@/utils/notify';

const store = useDepartmentsStore();
const route = useRoute();
const router = useRouter();

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.unexpected') : null
);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'department-form-error' });
});

const idParam = computed(() => route.params.id);
const isEdit = computed(() => typeof idParam.value === 'string');

const form = reactive<DepartmentInput>({
  name: '',
  description: null,
  managerId: null,
  isActive: true,
});

async function loadDepartment() {
  if (!isEdit.value) return;
  const id = Number(idParam.value);
  if (Number.isNaN(id)) return;
  const result = await store.fetchDepartmentById(id);
  if (result.ok && result.data) {
    form.name = result.data.name;
    form.description = result.data.description ?? null;
    form.managerId = result.data.managerId ?? null;
    form.isActive = result.data.isActive !== false;
  }
}

async function submit() {
  if (isEdit.value) {
    const id = Number(idParam.value);
    if (Number.isNaN(id)) return;
    const result = await store.updateDepartment(id, form);
    if (result.ok) {
      notifySuccess(t('common.saved'));
      await router.push('/hr/departments');
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
    }
    return;
  }

  const result = await store.createDepartment(form);
  if (result.ok) {
    notifySuccess(t('common.saved'));
    await router.push('/hr/departments');
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
  }
}

onMounted(() => {
  void loadDepartment();
});
</script>
