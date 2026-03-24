import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { payrollClient } from '../api';
import type { PayrollRun, PayrollRunInput } from '../api/endpoints/hr';

export const usePayrollStore = defineStore(
  'payroll',
  () => {
    const items = shallowRef<PayrollRun[]>([]);
    const total = ref(0);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchPayrollRuns(params?: { status?: string; limit?: number; offset?: number }) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.getAll(params);
      if (result.ok) {
        items.value = result.data.items;
        total.value = result.data.total;
      } else {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function fetchPayrollRunById(id: number) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.getById(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function createPayrollRun(payload: PayrollRunInput) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.create(payload);
      if (!result.ok) {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function submitPayrollRun(id: number) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.submit(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function approvePayrollRun(id: number) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.approve(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function disbursePayrollRun(id: number) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.disburse(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    async function cancelPayrollRun(id: number) {
      loading.value = true;
      error.value = null;
      const result = await payrollClient.cancel(id);
      if (!result.ok) {
        error.value = result.error.message;
      }
      loading.value = false;
      return result;
    }

    return {
      items,
      total,
      loading,
      error,
      fetchPayrollRuns,
      fetchPayrollRunById,
      createPayrollRun,
      submitPayrollRun,
      approvePayrollRun,
      disbursePayrollRun,
      cancelPayrollRun,
    };
  },
  { persist: true }
);
