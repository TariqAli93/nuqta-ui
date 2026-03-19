import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { employeesClient } from '../api';
import type { Employee, EmployeeInput } from '../types/domain';

export const useEmployeesStore = defineStore('employees', () => {
  const items = shallowRef<Employee[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchEmployees(params?: {
    search?: string;
    departmentId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    loading.value = true;
    error.value = null;
    const result = await employeesClient.getAll(params);
    if (result.ok) {
      items.value = result.data.items;
      total.value = result.data.total;
    } else {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function fetchEmployeeById(id: number) {
    loading.value = true;
    error.value = null;
    const result = await employeesClient.getById(id);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function createEmployee(payload: EmployeeInput) {
    loading.value = true;
    error.value = null;
    const result = await employeesClient.create(payload);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function updateEmployee(id: number, payload: EmployeeInput) {
    loading.value = true;
    error.value = null;
    const result = await employeesClient.update(id, payload);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  async function deleteEmployee(id: number) {
    loading.value = true;
    error.value = null;
    const result = await employeesClient.delete(id);
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
    fetchEmployees,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
});
