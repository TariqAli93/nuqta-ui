import type { RouteRecordRaw } from 'vue-router';

const EmployeesListView = () => import('../../views/hr/EmployeesListView.vue');
const EmployeeFormView = () => import('../../views/hr/EmployeeFormView.vue');
const EmployeeDetailsView = () => import('../../views/hr/EmployeeDetailsView.vue');
const DepartmentsListView = () => import('../../views/hr/DepartmentsListView.vue');
const DepartmentFormView = () => import('../../views/hr/DepartmentFormView.vue');
const PayrollListView = () => import('../../views/hr/PayrollListView.vue');
const PayrollFormView = () => import('../../views/hr/PayrollFormView.vue');
const PayrollDetailsView = () => import('../../views/hr/PayrollDetailsView.vue');

export const hrRoutes: RouteRecordRaw[] = [
  // ── Employees ───────────────────────────────────────────────────────────
  {
    path: 'hr/employees',
    name: 'Employees',
    component: EmployeesListView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: { title: 'hr.employees.title', to: '/hr/employees' },
    },
  },
  {
    path: 'hr/employees/new',
    name: 'EmployeeCreate',
    component: EmployeeFormView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.employees.title', to: '/hr/employees' },
        { title: 'common.add' },
      ],
    },
  },
  {
    path: 'hr/employees/:id',
    name: 'EmployeeDetails',
    component: EmployeeDetailsView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.employees.title', to: '/hr/employees' },
        { title: 'common.details' },
      ],
    },
  },
  {
    path: 'hr/employees/:id/edit',
    name: 'EmployeeEdit',
    component: EmployeeFormView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.employees.title', to: '/hr/employees' },
        { title: 'common.edit' },
      ],
    },
  },
  // ── Departments ─────────────────────────────────────────────────────────
  {
    path: 'hr/departments',
    name: 'Departments',
    component: DepartmentsListView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: { title: 'hr.departments.title', to: '/hr/departments' },
    },
  },
  {
    path: 'hr/departments/new',
    name: 'DepartmentCreate',
    component: DepartmentFormView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.departments.title', to: '/hr/departments' },
        { title: 'common.add' },
      ],
    },
  },
  {
    path: 'hr/departments/:id/edit',
    name: 'DepartmentEdit',
    component: DepartmentFormView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.departments.title', to: '/hr/departments' },
        { title: 'common.edit' },
      ],
    },
  },
  // ── Payroll ─────────────────────────────────────────────────────────────
  {
    path: 'hr/payroll',
    name: 'Payroll',
    component: PayrollListView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: { title: 'hr.payroll.title', to: '/hr/payroll' },
    },
  },
  {
    path: 'hr/payroll/new',
    name: 'PayrollCreate',
    component: PayrollFormView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.payroll.title', to: '/hr/payroll' },
        { title: 'common.add' },
      ],
    },
  },
  {
    path: 'hr/payroll/:id',
    name: 'PayrollDetails',
    component: PayrollDetailsView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.payroll.title', to: '/hr/payroll' },
        { title: 'common.details' },
      ],
    },
  },
  {
    path: 'hr/payroll/:id/edit',
    name: 'PayrollEdit',
    component: PayrollFormView,
    meta: {
      requiresRole: 'manager',
      breadcrumb: [
        { title: 'hr.payroll.title', to: '/hr/payroll' },
        { title: 'common.edit' },
      ],
    },
  },
];
