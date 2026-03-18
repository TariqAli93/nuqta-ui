import type { RouteRecordRaw } from 'vue-router';

const ProductWorkspaceView = () => import('../../views/products/ProductWorkspaceView.vue');

export const productsRoutes: RouteRecordRaw[] = [
  {
    path: 'products',
    name: 'ProductWorkspace',
    component: ProductWorkspaceView,
    meta: {
      permissions: ['products:read'],
      breadcrumb: { title: 'nav.products', to: '/products' },
    },
  },

  {
    path: 'products/new',
    name: 'ProductCreate',
    redirect: (to) => ({
      name: 'ProductWorkspace',
      query: { ...to.query, action: 'create' },
    }),
    meta: {
      permissions: ['products:create'],
      enableBarcode: 'product',
      breadcrumb: [{ title: 'nav.products', to: '/products' }, { title: 'products.new' }],
    },
  },
  {
    path: 'products/:id',
    name: 'ProductDetail',
    redirect: (to) => ({
      name: 'ProductWorkspace',
      query: { ...to.query, productId: String(to.params.id) },
    }),
    meta: {
      permissions: ['products:read'],
      breadcrumb: [{ title: 'nav.products', to: '/products' }, { title: 'common.details' }],
    },
  },
  {
    path: 'products/:id/edit',
    name: 'ProductEdit',
    redirect: (to) => ({
      name: 'ProductWorkspace',
      query: { ...to.query, productId: String(to.params.id), action: 'edit' },
    }),
    meta: {
      permissions: ['products:update'],
      enableBarcode: 'product',
      breadcrumb: [{ title: 'nav.products', to: '/products' }, { title: 'products.edit' }],
    },
  },
  {
    path: 'products/:id/barcode',
    name: 'BarcodePrint',
    redirect: (to) => ({
      name: 'ProductWorkspace',
      query: { ...to.query, productId: String(to.params.id), tab: 'units', action: 'barcode' },
    }),
    meta: {
      permissions: ['products:read'],
      breadcrumb: [
        { title: 'nav.products', to: '/products' },
        { title: 'products.unitsAndPricing' },
      ],
    },
  },
];
