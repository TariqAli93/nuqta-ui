import type { RouteRecordRaw } from 'vue-router';

const PurchasesListView = () => import('../../views/purchases/PurchasesListView.vue');
const PurchaseFormView = () => import('../../views/purchases/PurchaseFormView.vue');
const PurchaseDetailsView = () => import('../../views/purchases/PurchaseDetailsView.vue');

export const purchasesRoutes: RouteRecordRaw[] = [
  {
    path: 'purchases',
    name: 'Purchases',
    component: PurchasesListView,
    meta: {
      requiresPurchasing: true,
      permissions: ['purchases:read'],
      breadcrumb: { title: 'nav.purchases', to: '/purchases' },
    },
  },
  {
    path: 'purchases/new',
    name: 'PurchaseCreate',
    component: PurchaseFormView,
    meta: {
      permissions: ['purchases:create'],
      requiresPurchasing: true,
      breadcrumb: [
        { title: 'nav.purchases', to: '/purchases' },
        { title: 'common.add' },
      ],
    },
  },
  {
    path: 'purchases/:id',
    name: 'PurchaseDetails',
    component: PurchaseDetailsView,
    meta: {
      requiresPurchasing: true,
      permissions: ['purchases:read'],
      breadcrumb: [
        { title: 'nav.purchases', to: '/purchases' },
        { title: 'common.details' },
      ],
    },
  },
];
