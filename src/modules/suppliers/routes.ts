import type { RouteRecordRaw } from 'vue-router';

const SuppliersListView = () => import('../../views/suppliers/SuppliersListView.vue');
const SupplierFormView = () => import('../../views/suppliers/SupplierFormView.vue');
const SupplierDetailsView = () => import('../../views/suppliers/SupplierDetailsView.vue');
const SupplierLedgerView = () => import('../../views/suppliers/SupplierLedgerView.vue');

export const suppliersRoutes: RouteRecordRaw[] = [
  {
    path: 'suppliers',
    name: 'Suppliers',
    component: SuppliersListView,
    meta: {
      requiresPurchasing: true,
      permissions: ['suppliers:read'],
      breadcrumb: { title: 'nav.suppliers', to: '/suppliers' },
    },
  },
  {
    path: 'suppliers/ledger',
    name: 'SupplierLedger',
    component: SupplierLedgerView,
    meta: {
      requiresPurchasing: true,
      requiresLedgers: true,
      permissions: ['suppliers:read'],
      breadcrumb: [
        { title: 'nav.suppliers', to: '/suppliers' },
        { title: 'nav.supplierLedger' },
      ],
    },
  },
  {
    path: 'suppliers/new',
    name: 'SupplierCreate',
    component: SupplierFormView,
    meta: {
      permissions: ['suppliers:create'],
      requiresPurchasing: true,
      breadcrumb: [
        { title: 'nav.suppliers', to: '/suppliers' },
        { title: 'common.add' },
      ],
    },
  },
  {
    path: 'suppliers/:id',
    name: 'SupplierDetails',
    component: SupplierDetailsView,
    meta: {
      requiresPurchasing: true,
      requiresLedgers: true,
      permissions: ['suppliers:read'],
      breadcrumb: [
        { title: 'nav.suppliers', to: '/suppliers' },
        { title: 'common.details' },
      ],
    },
  },
  {
    path: 'suppliers/:id/edit',
    name: 'SupplierEdit',
    component: SupplierFormView,
    meta: {
      permissions: ['suppliers:update'],
      requiresPurchasing: true,
      breadcrumb: [
        { title: 'nav.suppliers', to: '/suppliers' },
        { title: 'common.edit' },
      ],
    },
  },
];
