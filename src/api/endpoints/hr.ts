/**
 * HR API endpoints.
 *
 * Covers: employees, departments, payroll runs.
 */
import type { ApiResult, PagedResult } from '../contracts';
import type {
  Employee,
  EmployeeInput,
  Department,
  DepartmentInput,
  PayrollRun,
  PayrollRunInput,
} from '../../types/domain';
import { apiGet, apiGetPaged, apiPost, apiPut, apiDelete } from '../http';

// ── Employees ───────────────────────────────────────────────────────────────

export const employeesClient = {
  getAll: (params?: {
    search?: string;
    departmentId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Employee>>> =>
    apiGetPaged<Employee>('/hr/employees/', params),

  getById: (id: number): Promise<ApiResult<Employee | null>> =>
    apiGet<Employee | null>(`/hr/employees/${id}`),

  create: (data: EmployeeInput): Promise<ApiResult<Employee>> =>
    apiPost<Employee>('/hr/employees/', data),

  update: (id: number, data: EmployeeInput): Promise<ApiResult<Employee>> =>
    apiPut<Employee>(`/hr/employees/${id}`, data),

  delete: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/hr/employees/${id}`),
};

// ── Departments ─────────────────────────────────────────────────────────────

export const departmentsClient = {
  getAll: (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Department>>> =>
    apiGetPaged<Department>('/hr/departments/', params),

  getById: (id: number): Promise<ApiResult<Department | null>> =>
    apiGet<Department | null>(`/hr/departments/${id}`),

  create: (data: DepartmentInput): Promise<ApiResult<Department>> =>
    apiPost<Department>('/hr/departments/', data),

  update: (id: number, data: DepartmentInput): Promise<ApiResult<Department>> =>
    apiPut<Department>(`/hr/departments/${id}`, data),

  delete: (id: number): Promise<ApiResult<{ ok: true }>> =>
    apiDelete<{ ok: true }>(`/hr/departments/${id}`),
};

// ── Payroll Runs ────────────────────────────────────────────────────────────

export const payrollClient = {
  getAll: (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<PayrollRun>>> =>
    apiGetPaged<PayrollRun>('/hr/payroll/', params),

  getById: (id: number): Promise<ApiResult<PayrollRun | null>> =>
    apiGet<PayrollRun | null>(`/hr/payroll/${id}`),

  create: (data: PayrollRunInput): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>('/hr/payroll/', data),

  update: (id: number, data: PayrollRunInput): Promise<ApiResult<PayrollRun>> =>
    apiPut<PayrollRun>(`/hr/payroll/${id}`, data),

  submit: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll/${id}/submit`),

  approve: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll/${id}/approve`),

  disburse: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll/${id}/disburse`),

  cancel: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll/${id}/cancel`),
};
