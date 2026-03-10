import type { RouteRecordRaw } from 'vue-router';

const AboutView = () => import('../../views/about/AboutView.vue');

export const aboutRoutes: RouteRecordRaw[] = [
  {
    path: 'about',
    name: 'About',
    component: AboutView,
  },
];
