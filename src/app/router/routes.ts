import type { RouteRecordRaw } from 'vue-router';

// Layouts — kept eager (needed immediately on navigation)
const PosLayout = () => import('../../layouts/PosLayout.vue');
const AuthLayout = () => import('../../layouts/AuthLayout.vue');
const MainLayout = () => import('../../layouts/MainLayout.vue');

// Lazy-loaded views — each generates a separate chunk
const PosView = () => import('../../views/pos/PosView.vue');
const ForbiddenView = () => import('../../views/system/ForbiddenView.vue');
const NotFoundView = () => import('../../views/system/NotFoundView.vue');
const DashboardView = () => import('../../views/dashboard/DashboardView.vue');
const BackupView = () => import('../../views/backup/BackupView.vue');

import { authRoutes, setupRoute } from '../../modules/auth/routes';
import { customersRoutes } from '../../modules/customers/routes';
import { productsRoutes } from '../../modules/products/routes';
import { salesRoutes } from '../../modules/sales/routes';
import { settingsRoutes } from '../../modules/settings/routes';
import { usersRoutes } from '../../modules/users/routes';
import { categoriesRoutes } from '../../modules/categories/routes';
import { profileRoutes } from '../../modules/profile/routes';
import { aboutRoutes } from '../../modules/about/routes';
import { suppliersRoutes } from '../../modules/suppliers/routes';
import { purchasesRoutes } from '../../modules/purchases/routes';
import { inventoryRoutes } from '../../modules/inventory/routes';
import { accountingRoutes } from '../../modules/accounting/routes';

export const routes: RouteRecordRaw[] = [
  setupRoute,
  {
    path: '/auth',
    component: AuthLayout,
    meta: { breadcrumb: { title: 'auth.loginTitle', to: '/auth/login' } },
    children: authRoutes,
  },
  {
    path: '/',
    component: PosLayout,
    meta: { requiresAuth: true, breadcrumb: { title: 'nav.dashboard', to: '/dashboard' } },
    children: [
      {
        path: '',
        redirect: '/pos',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { breadcrumb: { title: 'nav.dashboard', to: '/dashboard' } },
      },
      {
        path: 'backup',
        name: 'Backup',
        component: BackupView,
        meta: {
          requiresRole: 'admin',
          breadcrumb: [
            { title: 'nav.dashboard', to: '/dashboard' },
            { title: 'nav.reports', to: '/backup' },
          ],
        },
      },

      {
        path: 'pos',
        name: 'POS',
        component: PosView,
        meta: {
          requiresCreateSales: true,
          enableBarcode: 'pos',
          breadcrumb: { title: 'nav.pos', to: '/pos' },
        },
      },
      ...customersRoutes,
      ...productsRoutes,
      ...salesRoutes,
      ...suppliersRoutes,
      ...purchasesRoutes,
      ...inventoryRoutes,
      ...accountingRoutes,
      ...settingsRoutes,
      ...usersRoutes,
      ...categoriesRoutes,
      ...profileRoutes,
      ...aboutRoutes,
      {
        path: 'forbidden',
        name: 'Forbidden',
        component: ForbiddenView,
        meta: { breadcrumb: { title: 'system.forbiddenTitle', to: '/forbidden' } },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { breadcrumb: { title: 'system.notFoundTitle' } },
  },
];
