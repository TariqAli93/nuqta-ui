import type { RouteRecordRaw } from 'vue-router';

const CustomersListView = () => import('../../views/customers/CustomersListView.vue');
const CustomerFormView = () => import('../../views/customers/CustomerFormView.vue');
const CustomerProfileView = () => import('../../views/customers/CustomerProfileView.vue');
const CustomerLedgerView = () => import('../../views/customers/CustomerLedgerView.vue');

export const customersRoutes: RouteRecordRaw[] = [
  {
    path: 'customers',
    name: 'Customers',
    component: CustomersListView,
    meta: { requiresManageCustomers: true },
  },
  {
    path: 'customers/ledger',
    name: 'CustomerLedger',
    component: CustomerLedgerView,
    meta: { requiresLedgers: true, requiresManageCustomers: true },
  },
  {
    path: 'customers/new',
    name: 'CustomerCreate',
    component: CustomerFormView,
    meta: { requiresManageCustomers: true },
  },
  {
    path: 'customers/:id',
    name: 'CustomerProfile',
    component: CustomerProfileView,
    meta: { requiresLedgers: true, requiresManageCustomers: true },
  },
  {
    path: 'customers/:id/edit',
    name: 'CustomerEdit',
    component: CustomerFormView,
    meta: { requiresManageCustomers: true },
  },
];
