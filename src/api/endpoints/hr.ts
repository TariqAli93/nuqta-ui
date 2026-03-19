/**
 * HR API endpoints.
 *
 * Covers: employees, departments, payroll runs.
 *
 * Backend schema for Employee uses flat string fields:
 *   { id, name, salary, position, department, isActive }
 *
 * Backend schema for PayrollRun uses integer year/month (not ISO date strings):
 *   { id, periodYear, periodMonth, paymentDate, status,
 *     totalGrossPay, totalDeductions, totalBonuses, totalNetPay,
 *     items[{ employeeId, grossPay, deductions, bonuses, netPay }] }
 */
import type { ApiResult, PagedResult } from '../contracts';
import { apiGet, apiGetPaged, apiPost, apiPut } from '../http';

// ── Employee ──────────────────────────────────────────────────────────────────

export interface Employee {
  id?: number;
  name: string;
  salary: number;
  position: string;
  department: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  createdBy?: number | null;
}

export interface EmployeeInput {
  name: string;
  salary: number;
  position: string;
  department: string;
  isActive?: boolean;
}

// ── Department ────────────────────────────────────────────────────────────────

export interface Department {
  id?: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  createdBy?: number | null;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

// ── Payroll Run ───────────────────────────────────────────────────────────────

export type PayrollRunStatus = 'draft' | 'submitted' | 'approved' | 'disbursed' | 'cancelled';

export interface PayrollRunItem {
  id?: number;
  payrollRunId?: number;
  employeeId: number;
  employeeName?: string;
  position?: string;
  department?: string;
  grossPay: number;
  deductions: number;
  bonuses: number;
  netPay: number;
  notes?: string | null;
  createdAt?: string;
}

export interface PayrollRun {
  id?: number;
  periodYear: number;
  periodMonth: number;
  paymentDate?: string | null;
  status?: PayrollRunStatus;
  totalGrossPay?: number;
  totalDeductions?: number;
  totalBonuses?: number;
  totalNetPay?: number;
  salaryExpenseAccountCode?: string;
  deductionsLiabilityAccountCode?: string;
  paymentAccountCode?: string;
  journalEntryId?: number | null;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number | null;
  approvedAt?: string | null;
  approvedBy?: number | null;
  items?: PayrollRunItem[];
}

export interface PayrollRunInput {
  periodYear: number;
  periodMonth: number;
  paymentDate?: string;
  salaryExpenseAccountCode?: string;
  deductionsLiabilityAccountCode?: string;
  paymentAccountCode?: string;
  notes?: string;
  items: {
    employeeId: number;
    deductions?: number;
    bonuses?: number;
    notes?: string;
  }[];
}

// ── Employees ─────────────────────────────────────────────────────────────────

export const employeesClient = {
  getAll: (params?: {
    search?: string;
    department?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Employee>>> =>
    apiGetPaged<Employee>('/hr/employees', params),

  getById: (id: number): Promise<ApiResult<Employee | null>> =>
    apiGet<Employee | null>(`/hr/employees/${id}`),

  create: (data: EmployeeInput): Promise<ApiResult<Employee>> =>
    apiPost<Employee>('/hr/employees', data),

  update: (id: number, data: Partial<EmployeeInput>): Promise<ApiResult<Employee>> =>
    apiPut<Employee>(`/hr/employees/${id}`, data),
};

// ── Departments ───────────────────────────────────────────────────────────────

export const departmentsClient = {
  getAll: (params?: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<Department>>> =>
    apiGetPaged<Department>('/hr/departments', params),

  getById: (id: number): Promise<ApiResult<Department | null>> =>
    apiGet<Department | null>(`/hr/departments/${id}`),

  create: (data: DepartmentInput): Promise<ApiResult<Department>> =>
    apiPost<Department>('/hr/departments', data),

  update: (id: number, data: Partial<DepartmentInput>): Promise<ApiResult<Department>> =>
    apiPut<Department>(`/hr/departments/${id}`, data),
};

// ── Payroll Runs ──────────────────────────────────────────────────────────────

export const payrollClient = {
  getAll: (params?: {
    status?: PayrollRunStatus;
    periodYear?: number;
    periodMonth?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<PayrollRun>>> =>
    apiGetPaged<PayrollRun>('/hr/payroll-runs', params),

  getById: (id: number): Promise<ApiResult<PayrollRun | null>> =>
    apiGet<PayrollRun | null>(`/hr/payroll-runs/${id}`),

  create: (data: PayrollRunInput): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>('/hr/payroll-runs', data),

  submit: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll-runs/${id}/submit`),

  approve: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll-runs/${id}/approve`),

  disburse: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll-runs/${id}/disburse`),

  cancel: (id: number): Promise<ApiResult<PayrollRun>> =>
    apiPost<PayrollRun>(`/hr/payroll-runs/${id}/cancel`),
};
