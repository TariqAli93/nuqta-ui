import type { RouteRecordRaw } from 'vue-router';

const LoginView = () => import('../../views/auth/LoginView.vue');
const SetupView = () => import('../../views/auth/SetupView.vue');

export const authRoutes: RouteRecordRaw[] = [
  {
    path: 'login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true },
  },
];

export const setupRoute: RouteRecordRaw = {
  path: '/setup',
  name: 'InitialSetup',
  component: SetupView,
};
