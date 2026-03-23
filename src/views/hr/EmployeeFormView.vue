<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div class="d-flex align-center ga-3">
        <v-btn icon="mdi-arrow-right" variant="text" size="small" @click="router.back()" />
        <div>
          <div class="win-title">
            {{ isEdit ? t('hr.employees.edit') : t('hr.employees.new') }}
          </div>
          <div class="text-sm text-medium-emphasis">{{ t('hr.employees.formHint') }}</div>
        </div>
      </div>
    </div>

    <v-card flat>
      <v-form class="win-form" @submit.prevent="submit">
        <v-text-field v-model="form.fullName" :label="t('common.fullName')" required />
        <div class="d-flex flex-wrap ga-2">
          <v-text-field v-model="form.phone" :label="t('common.phone')" />
          <v-text-field v-model="form.email" :label="t('hr.employees.email')" />
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-select
            v-model="form.departmentId"
            :items="departmentItems"
            :label="t('hr.departments.singular')"
            item-title="name"
            item-value="id"
            clearable
            variant="outlined"
            density="comfortable"
          />
          <v-text-field v-model="form.designation" :label="t('hr.employees.designation')" />
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-text-field
            v-model="form.dateOfJoining"
            :label="t('hr.employees.dateOfJoining')"
            type="date"
          />
          <v-text-field
            v-model="form.dateOfBirth"
            :label="t('hr.employees.dateOfBirth')"
            type="date"
          />
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-text-field
            v-model.number="form.salary"
            :label="t('hr.employees.salary')"
            type="number"
          />
          <v-select
            v-model="form.status"
            :items="statusOptions"
            :label="t('common.status')"
            variant="outlined"
            density="comfortable"
          />
        </div>
        <v-text-field v-model="form.address" :label="t('hr.employees.address')" />
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
          <v-btn variant="text" class="win-ghost-btn" to="/hr/employees">
            {{ t('common.cancel') }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useEmployeesStore } from '@/stores/employeesStore';
import { useDepartmentsStore } from '@/stores/departmentsStore';
import type { EmployeeInput } from '@/types/domain';
import { notifyError, notifySuccess } from '@/utils/notify';

const store = useEmployeesStore();
const departmentsStore = useDepartmentsStore();
const route = useRoute();
const router = useRouter();

const departmentItems = ref<{ id: number; name: string }[]>([]);

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.unexpected') : null
);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'employee-form-error' });
});

const idParam = computed(() => route.params.id);
const isEdit = computed(() => typeof idParam.value === 'string');

const statusOptions = [
  { title: t('hr.employees.statusActive'), value: 'active' },
  { title: t('hr.employees.statusInactive'), value: 'inactive' },
  { title: t('hr.employees.statusTerminated'), value: 'terminated' },
  { title: t('hr.employees.statusOnLeave'), value: 'on_leave' },
];

const form = reactive<EmployeeInput>({
  fullName: '',
  phone: null,
  email: null,
  departmentId: null,
  designation: null,
  dateOfJoining: null,
  dateOfBirth: null,
  salary: null,
  status: 'active',
  address: null,
  notes: null,
});

async function loadDepartments() {
  const result = await departmentsStore.fetchDepartments({ limit: 100 });
  if (result.ok) {
    departmentItems.value = result.data.items.map((d) => ({ id: d.id!, name: d.name }));
  }
}

async function loadEmployee() {
  if (!isEdit.value) return;
  const id = Number(idParam.value);
  if (Number.isNaN(id)) return;
  const result = await store.fetchEmployeeById(id);
  if (result.ok && result.data) {
    form.fullName = result.data.fullName;
    form.phone = result.data.phone ?? null;
    form.email = result.data.email ?? null;
    form.departmentId = result.data.departmentId ?? null;
    form.designation = result.data.designation ?? null;
    form.dateOfJoining = result.data.dateOfJoining ?? null;
    form.dateOfBirth = result.data.dateOfBirth ?? null;
    form.salary = result.data.salary ?? null;
    form.status = result.data.status ?? 'active';
    form.address = result.data.address ?? null;
    form.notes = result.data.notes ?? null;
  }
}

async function submit() {
  if (isEdit.value) {
    const id = Number(idParam.value);
    if (Number.isNaN(id)) return;
    const result = await store.updateEmployee(id, form);
    if (result.ok) {
      notifySuccess(t('common.saved'));
      await router.push('/hr/employees');
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
    }
    return;
  }

  const result = await store.createEmployee(form);
  if (result.ok) {
    notifySuccess(t('common.saved'));
    await router.push('/hr/employees');
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
  }
}

onMounted(() => {
  void loadDepartments();
  void loadEmployee();
});
</script>
