<template>
  <v-container>
    <div class="win-page">
      <v-app-bar class="mb-6" border="bottom">
        <v-app-bar-title>
          <div class="win-title mb-0">{{ t('settings.title') }}</div>
          <div class="text-sm">{{ t('settings.subtitle') }}</div>
        </v-app-bar-title>
      </v-app-bar>

      <v-card class="win-card" flat>
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="system" @click="navigateTo('system')">
            <v-icon start>mdi-cog</v-icon>
            النظام
          </v-tab>
          <v-tab value="pos" @click="navigateTo('pos')">
            <v-icon start>mdi-point-of-sale</v-icon>
            نقاط البيع
          </v-tab>
          <v-tab value="accounting" @click="navigateTo('accounting')">
            <v-icon start>mdi-calculator</v-icon>
            المحاسبة
          </v-tab>
          <v-tab v-if="canManageUsers" value="users" @click="navigateTo('users')">
            <v-icon start>mdi-account-group</v-icon>
            المستخدمين
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-card-text>
          <router-view />
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { t } from '../../i18n/t';
import { useRBAC } from '../../composables/useRBAC';

type SettingsTab = 'system' | 'pos' | 'accounting' | 'users';

const route = useRoute();
const router = useRouter();
const { can } = useRBAC();
const activeTab = ref<SettingsTab>('system');

const canManageUsers = computed(() => can('users:read'));

const tabToRoute: Record<SettingsTab, string> = {
  system: '/settings/system',
  pos: '/settings/pos',
  accounting: '/settings/accounting',
  users: '/settings/users',
};

function getTabFromPath(path: string): SettingsTab {
  if (path.includes('/settings/pos')) return 'pos';
  if (path.includes('/settings/accounting')) return 'accounting';
  if (path.includes('/settings/users')) return 'users';
  return 'system';
}

function resolveAllowedTab(tab: SettingsTab): SettingsTab {
  if (tab === 'users' && !canManageUsers.value) return 'system';
  return tab;
}

function navigateTo(tab: SettingsTab) {
  const allowed = resolveAllowedTab(tab);
  void router.push(tabToRoute[allowed]);
}

// Sync active tab from current route
watch(
  () => route.path,
  (path) => {
    const tab = getTabFromPath(path);
    const allowed = resolveAllowedTab(tab);
    activeTab.value = allowed;
    if (tab !== allowed) {
      void router.replace(tabToRoute[allowed]);
    }
  },
  { immediate: true }
);
</script>
