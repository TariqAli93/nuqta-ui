import type { RouteRecordRaw } from 'vue-router';

const CategoriesView = () => import('../../views/categories/CategoriesView.vue');

export const categoriesRoutes: RouteRecordRaw[] = [
  {
    path: 'categories',
    name: 'Categories',
    component: CategoriesView,
    meta: {
      requiresManageProducts: true,
      breadcrumb: { title: 'nav.categories', to: '/categories' },
    },
  },
];
