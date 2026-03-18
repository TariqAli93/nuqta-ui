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
    meta: {
      permissions: ['customers:read'],
      breadcrumb: { title: 'nav.customers', to: '/customers' },
    },
  },
  {
    path: 'customers/ledger',
    name: 'CustomerLedger',
    component: CustomerLedgerView,
    meta: {
      requiresLedgers: true,
      permissions: ['customers:read'],
      breadcrumb: [
        { title: 'nav.customers', to: '/customers' },
        { title: 'nav.customerLedger' },
      ],
    },
  },
  {
    path: 'customers/new',
    name: 'CustomerCreate',
    component: CustomerFormView,
    meta: {
      permissions: ['customers:create'],
      breadcrumb: [
        { title: 'nav.customers', to: '/customers' },
        { title: 'common.add' },
      ],
    },
  },
  {
    path: 'customers/:id',
    name: 'CustomerProfile',
    component: CustomerProfileView,
    meta: {
      requiresLedgers: true,
      permissions: ['customers:read'],
      breadcrumb: [
        { title: 'nav.customers', to: '/customers' },
        { title: 'common.details' },
      ],
    },
  },
  {
    path: 'customers/:id/edit',
    name: 'CustomerEdit',
    component: CustomerFormView,
    meta: {
      permissions: ['customers:update'],
      breadcrumb: [
        { title: 'nav.customers', to: '/customers' },
        { title: 'common.edit' },
      ],
    },
  },
];
