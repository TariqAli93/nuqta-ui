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
    meta: { requiresPurchasing: true, requiresManageSuppliers: true },
  },
  {
    path: 'suppliers/ledger',
    name: 'SupplierLedger',
    component: SupplierLedgerView,
    meta: { requiresPurchasing: true, requiresLedgers: true, requiresManageSuppliers: true },
  },
  {
    path: 'suppliers/new',
    name: 'SupplierCreate',
    component: SupplierFormView,
    meta: { requiresManageSuppliers: true, requiresPurchasing: true },
  },
  {
    path: 'suppliers/:id',
    name: 'SupplierDetails',
    component: SupplierDetailsView,
    meta: { requiresPurchasing: true, requiresLedgers: true, requiresManageSuppliers: true },
  },
  {
    path: 'suppliers/:id/edit',
    name: 'SupplierEdit',
    component: SupplierFormView,
    meta: { requiresManageSuppliers: true, requiresPurchasing: true },
  },
];
