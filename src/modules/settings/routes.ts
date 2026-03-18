import type { RouteRecordRaw } from 'vue-router';

const SettingsLayout = () => import('../../views/settings/SettingsLayout.vue');
const SystemSettingsPage = () => import('../../views/settings/SystemSettingsPage.vue');
const AccountingSettingsPage = () => import('../../views/settings/AccountingSettingsPage.vue');
const PosSettingsPage = () => import('../../views/settings/PosSettingsPage.vue');
const UsersTab = () => import('../../components/settings/UsersTab.vue');

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings',
    component: SettingsLayout,
    meta: {
      permissions: ['settings:read'],
      breadcrumb: { title: 'nav.settings', to: '/settings/system' },
    },
    redirect: { name: 'SettingsSystem' },
    children: [
      {
        path: 'system',
        name: 'SettingsSystem',
        component: SystemSettingsPage,
        meta: { breadcrumb: { title: 'settings.companyInfo' } },
      },
      {
        path: 'pos',
        name: 'SettingsPOS',
        component: PosSettingsPage,
        meta: { breadcrumb: { title: 'nav.pos' } },
      },
      {
        path: 'accounting',
        name: 'SettingsAccounting',
        component: AccountingSettingsPage,
        meta: { breadcrumb: { title: 'nav.accounting' } },
      },
      {
        path: 'users',
        name: 'SettingsUsers',
        component: UsersTab,
        meta: { breadcrumb: { title: 'nav.users' } },
      },
    ],
  },
];
