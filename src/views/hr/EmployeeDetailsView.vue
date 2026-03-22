<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div class="d-flex align-center ga-3">
        <v-btn icon="mdi-arrow-right" variant="text" size="small" @click="router.back()" />
        <div>
          <div class="win-title">{{ t('hr.employees.details') }}</div>
          <div class="text-sm text-medium-emphasis">{{ employee?.fullName ?? '' }}</div>
        </div>
      </div>
      <div class="ds-page-header__actions ds-stack-xs">
        <v-btn
          variant="tonal"
          size="small"
          :to="`/hr/employees/${route.params.id}/edit`"
          prepend-icon="mdi-pencil"
        >
          {{ t('common.edit') }}
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          color="error"
          prepend-icon="mdi-delete"
          @click="confirmDelete = true"
        >
          {{ t('common.delete') }}
        </v-btn>
      </div>
    </div>

    <v-progress-linear v-if="store.loading" indeterminate color="primary" />

    <v-card v-if="employee" flat>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('common.fullName') }}</div>
            <div class="text-body-1 font-weight-medium">{{ employee.fullName }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('common.status') }}</div>
            <StatusBadge :status="employee.status ?? 'active'" />
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('common.phone') }}</div>
            <div>{{ employee.phone || t('common.none') }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('hr.employees.email') }}</div>
            <div>{{ employee.email || t('common.none') }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">
              {{ t('hr.employees.designation') }}
            </div>
            <div>{{ employee.designation || t('common.none') }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">
              {{ t('hr.departments.singular') }}
            </div>
            <div>{{ departmentName }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">
              {{ t('hr.employees.dateOfJoining') }}
            </div>
            <div>{{ employee.dateOfJoining || t('common.none') }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">
              {{ t('hr.employees.dateOfBirth') }}
            </div>
            <div>{{ employee.dateOfBirth || t('common.none') }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('hr.employees.salary') }}</div>
            <div class="font-weight-bold">
              {{ employee.salary != null ? formatNumber(employee.salary) : t('common.none') }}
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">{{ t('hr.employees.address') }}</div>
            <div>{{ employee.address || t('common.none') }}</div>
          </v-col>
          <v-col v-if="employee.notes" cols="12">
            <div class="text-caption text-medium-emphasis">{{ t('common.notes') }}</div>
            <div>{{ employee.notes }}</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <EmptyState
      v-if="!employee && !store.loading"
      icon="mdi-account-off"
      :title="t('hr.employees.notFound')"
      :description="t('hr.employees.notFoundHint')"
      :action-label="t('hr.employees.title')"
      action-to="/hr/employees"
      action-icon="mdi-arrow-right"
    />

    <v-dialog v-model="confirmDelete" max-width="400" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>{{ t('hr.employees.deleteConfirm') }}</v-card-title>
        <v-card-text>{{ t('hr.employees.deleteHint') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDelete = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" :loading="store.loading" @click="handleDelete">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mapErrorToArabic, t } from '../../i18n/t';
import { useEmployeesStore } from '../../stores/employeesStore';
import { useDepartmentsStore } from '../../stores/departmentsStore';
import type { Employee } from '../../types/domain';
import EmptyState from '../../components/emptyState.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';
import { notifyError, notifySuccess } from '@/utils/notify';

const store = useEmployeesStore();
const departmentsStore = useDepartmentsStore();
const route = useRoute();
const router = useRouter();

const employee = ref<Employee | null>(null);
const confirmDelete = ref(false);
const departmentName = ref(t('common.none'));

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ar-IQ').format(value);
}

async function loadEmployee() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.fetchEmployeeById(id);
  if (result.ok && result.data) {
    employee.value = result.data;
    if (result.data.departmentId) {
      const deptResult = await departmentsStore.fetchDepartmentById(result.data.departmentId);
      if (deptResult.ok && deptResult.data) {
        departmentName.value = deptResult.data.name;
      }
    }
  }
}

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'employee-details-error' });
});

async function handleDelete() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  const result = await store.deleteEmployee(id);
  if (result.ok) {
    notifySuccess(t('hr.employees.deleted'));
    await router.push('/hr/employees');
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.deleteFailed'));
    confirmDelete.value = false;
  }
}

onMounted(() => {
  void loadEmployee();
});
</script>
