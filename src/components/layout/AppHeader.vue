<template>
  <v-app-bar :order="1" location="top" flat height="52" border="bottom">
    <v-container class="flex" fluid>
      <v-app-bar-nav-icon @click="$emit('toggleDrawer')" />

      <div class="d-flex align-center ga-3">
        <span class="text-caption text-medium-emphasis">
          {{ currentDate }} <span class="mx-1">|</span> {{ currentUser }}
        </span>
        <v-chip size="small" variant="tonal" prepend-icon="mdi-clock-outline" class="ds-hide-xs">
          {{ t('pos.shift') }}: {{ shiftTime }}
        </v-chip>
      </div>

      <v-spacer />

      <div class="d-flex align-center ga-1">
        <v-tooltip :text="sseConnected ? t('layout.sseConnected') : t('layout.sseDisconnected')">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" icon size="small">
              <v-icon :color="sseConnected ? 'success' : 'grey'" size="20">
                {{ sseConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
              </v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-btn variant="text" icon size="small" @click="$emit('toggleTheme')">
          <v-icon size="20">mdi-theme-light-dark</v-icon>
        </v-btn>

        <v-menu>
          <template #activator="{ props }">
            <v-btn variant="text" v-bind="props" size="small" class="flex items-center">
              <v-icon size="20">mdi-account-circle</v-icon>
              <span class="ds-hide-xs mr-3">{{ currentUser }}</span>
            </v-btn>
          </template>
          <v-list nav density="comfortable" min-width="180">
            <v-list-item to="/profile" prepend-icon="mdi-account-outline">
              <v-list-item-title>{{ t('nav.profile') }}</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item prepend-icon="mdi-logout" @click="$emit('logout')">
              <v-list-item-title>{{ t('common.logout') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';

defineProps<{
  currentUser: string;
  currentDate: string;
  shiftTime: string;
  sseConnected: boolean;
}>();

defineEmits<{
  toggleDrawer: [];
  toggleTheme: [];
  logout: [];
}>();
</script>
