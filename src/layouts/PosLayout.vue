<template>
  <v-app>
    <AppSidebar
      v-model="appNavigationDrawer"
      :primary-nav="primaryNav"
      :footer-nav="footerNav"
      :is-nav-active="isNavActive"
    />

    <v-main>
      <router-view />
      <AppHeader
        :current-user="currentUser"
        :current-date="currentDate"
        :shift-time="shiftTime"
        :sse-connected="sseConnected"
        @toggle-drawer="appNavigationDrawer = !appNavigationDrawer"
        @toggle-theme="toggleTheme"
        @logout="logout"
      />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import { useInventoryAlerts } from '@/composables/useInventoryAlerts';
import { usePosNavigation } from '@/composables/usePosNavigation';
import { usePosSession } from '@/composables/usePosSession';

const { connected: sseConnected } = useInventoryAlerts();
const { appNavigationDrawer, isNavActive, primaryNav, footerNav } = usePosNavigation();
const { currentUser, currentDate, shiftTime, toggleTheme, logout } = usePosSession();
</script>
