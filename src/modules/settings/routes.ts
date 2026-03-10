import type { RouteRecordRaw } from 'vue-router';

const SettingsLayout = () => import('../../views/settings/SettingsLayout.vue');
const SystemSettingsPage = () => import('../../views/settings/SystemSettingsPage.vue');
const AccountingSettingsPage = () => import('../../views/settings/AccountingSettingsPage.vue');
const PosSettingsPage = () => import('../../views/settings/PosSettingsPage.vue');
const BarcodeSettingsPage = () => import('../../views/settings/BarcodeSettingsPage.vue');
const UsersTab = () => import('../../components/settings/UsersTab.vue');

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings',
    component: SettingsLayout,
    meta: { requiresManageSettings: true },
    redirect: { name: 'SettingsSystem' },
    children: [
      {
        path: 'system',
        name: 'SettingsSystem',
        component: SystemSettingsPage,
      },
      {
        path: 'pos',
        name: 'SettingsPOS',
        component: PosSettingsPage,
      },
      {
        path: 'accounting',
        name: 'SettingsAccounting',
        component: AccountingSettingsPage,
      },
      {
        path: 'barcode',
        name: 'SettingsBarcode',
        component: BarcodeSettingsPage,
      },
      {
        path: 'users',
        name: 'SettingsUsers',
        component: UsersTab,
      },
    ],
  },
];
