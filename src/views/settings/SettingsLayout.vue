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
          <v-tab v-if="canPrintBarcodes" value="barcode" @click="navigateTo('barcode')">
            <v-icon start>mdi-barcode</v-icon>
            الباركود
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
import { useAuthStore } from '../../stores/authStore';
import { useAccess } from '../../composables/useAccess';

type SettingsTab = 'system' | 'pos' | 'accounting' | 'barcode' | 'users';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const access = useAccess();
const activeTab = ref<SettingsTab>('system');

const canManageUsers = computed(() => {
  const role = authStore.user?.role;
  if (!role) return false;
  if (access.canManageUsers.value) return true;
  return authStore.permissions.some((permission) =>
    ['users:read', 'users:create', 'users:update', 'users:delete'].includes(permission)
  );
});

const canPrintBarcodes = computed(() => access.canPrintBarcodes.value);

const tabToRoute: Record<SettingsTab, string> = {
  system: '/settings/system',
  pos: '/settings/pos',
  accounting: '/settings/accounting',
  barcode: '/settings/barcode',
  users: '/settings/users',
};

function getTabFromPath(path: string): SettingsTab {
  if (path.includes('/settings/pos')) return 'pos';
  if (path.includes('/settings/accounting')) return 'accounting';
  if (path.includes('/settings/barcode')) return 'barcode';
  if (path.includes('/settings/users')) return 'users';
  return 'system';
}

function resolveAllowedTab(tab: SettingsTab): SettingsTab {
  if (tab === 'barcode' && !canPrintBarcodes.value) return 'system';
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
