import type { RouteRecordRaw } from 'vue-router';

const ProfileView = () => import('../../views/profile/ProfileView.vue');

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: 'profile',
    name: 'Profile',
    component: ProfileView,
    meta: {
      breadcrumb: { title: 'nav.profile', to: '/profile' },
    },
  },
];
