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
      permissions: ['hr:read'],
      breadcrumb: { title: 'hr.employees.title', to: '/hr/employees' },
    },
  },
  {
    path: 'hr/employees/new',
    name: 'EmployeeCreate',
    component: EmployeeFormView,
    meta: {
      permissions: ['hr:update'],
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
      permissions: ['hr:read'],
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
      permissions: ['hr:update'],
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
      permissions: ['hr:read'],
      breadcrumb: { title: 'hr.departments.title', to: '/hr/departments' },
    },
  },
  {
    path: 'hr/departments/new',
    name: 'DepartmentCreate',
    component: DepartmentFormView,
    meta: {
      permissions: ['hr:update'],
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
      permissions: ['hr:update'],
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
      permissions: ['payroll:read'],
      breadcrumb: { title: 'hr.payroll.title', to: '/hr/payroll' },
    },
  },
  {
    path: 'hr/payroll/new',
    name: 'PayrollCreate',
    component: PayrollFormView,
    meta: {
      permissions: ['payroll:update'],
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
      permissions: ['payroll:read'],
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
      permissions: ['payroll:update'],
      breadcrumb: [
        { title: 'hr.payroll.title', to: '/hr/payroll' },
        { title: 'common.edit' },
      ],
    },
  },
];
