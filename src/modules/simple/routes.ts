import type { RouteRecordRaw } from 'vue-router';

const SimpleSalesView = () => import('../../views/simple/SimpleSalesView.vue');
const SimpleProductCreateView = () => import('../../views/simple/SimpleProductCreateView.vue');

export const simpleModeRoutes: RouteRecordRaw[] = [
  {
    path: 'simple/sales',
    name: 'SimpleSales',
    component: SimpleSalesView,
    meta: { requiresCreateSales: true },
  },
  {
    path: 'simple/products',
    name: 'SimpleProductCreate',
    component: SimpleProductCreateView,
    meta: { requiresManageProducts: true },
  },
  {
    path: 'simple/products/new',
    redirect: { name: 'SimpleProductCreate' },
  },
];
