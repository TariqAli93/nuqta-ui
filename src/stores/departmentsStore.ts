import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { departmentsClient } from '../api';
import type { Department, DepartmentInput } from '../api/endpoints/hr';

export const useDepartmentsStore = defineStore('departments', () => {
  const items = shallowRef<Department[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDepartments(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    loading.value = true;
    error.value = null;
    const result = await departmentsClient.getAll(params);
    if (result.ok) {
      items.value = result.data.items;
      total.value = result.data.total;
    } else {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function fetchDepartmentById(id: number) {
    loading.value = true;
    error.value = null;
    const result = await departmentsClient.getById(id);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function createDepartment(payload: DepartmentInput) {
    loading.value = true;
    error.value = null;
    const result = await departmentsClient.create(payload);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function updateDepartment(id: number, payload: DepartmentInput) {
    loading.value = true;
    error.value = null;
    const result = await departmentsClient.update(id, payload);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function deleteDepartment(id: number) {
    loading.value = true;
    error.value = null;
    const result = await departmentsClient.delete(id);
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
    fetchDepartments,
    fetchDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
});
