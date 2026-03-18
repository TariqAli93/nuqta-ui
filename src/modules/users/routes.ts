import type { RouteRecordRaw } from 'vue-router';

export const usersRoutes: RouteRecordRaw[] = [
  {
    path: 'users',
    name: 'Users',
    redirect: { name: 'SettingsUsers' },
    meta: { permissions: ['users:read'] },
  },
];
