import type { RouteRecordRaw } from 'vue-router';

const SalesListView = () => import('../../views/sales/SalesListView.vue');
const SaleFormView = () => import('../../views/sales/SaleFormView.vue');
const SaleDetailsView = () => import('../../views/sales/SaleDetailsView.vue');

export const salesRoutes: RouteRecordRaw[] = [
  {
    path: 'sales',
    name: 'Sales',
    component: SalesListView,
    meta: { requiresCreateSales: true },
  },
  {
    path: 'sales/new',
    name: 'SaleCreate',
    component: SaleFormView,
    meta: { requiresCreateSales: true, enableBarcode: 'pos' },
  },
  {
    path: 'sales/:id',
    name: 'SaleDetails',
    component: SaleDetailsView,
    meta: { requiresCreateSales: true },
  },
];
