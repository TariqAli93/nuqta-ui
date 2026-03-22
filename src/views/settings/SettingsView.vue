<template>
  <div class="nq-page">
    <PageHeader :title="t('settings.title')" :subtitle="t('settings.subtitle')" />

    <v-card>
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="system">إعدادات النظام</v-tab>
        <v-tab value="pos">نقطة البيع</v-tab>
        <v-tab value="accounting">المحاسبة</v-tab>
        <v-tab v-if="canManageUsers" value="users">المستخدمين</v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab">
        <v-window-item value="system">
          <v-card-text>
            <SystemSettingsTab />
          </v-card-text>
        </v-window-item>

        <v-window-item value="pos">
          <v-card-text>
            <PosSettingsTab />
          </v-card-text>
        </v-window-item>

        <v-window-item value="accounting">
          <v-card-text>
            <AccountingSettingsTab />
          </v-card-text>
        </v-window-item>

        <v-window-item v-if="canManageUsers" value="users">
          <v-card-text>
            <UsersTab />
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { t } from '../../i18n/t';
import { useRBAC } from '../../composables/useRBAC';
import PageHeader from '@/components/common/PageHeader.vue';
import SystemSettingsTab from '@/components/settings/SystemSettingsTab.vue';
import PosSettingsTab from '@/components/settings/PosSettingsTab.vue';
import AccountingSettingsTab from '@/components/settings/AccountingSettingsTab.vue';
import UsersTab from '@/components/settings/UsersTab.vue';

type SettingsTab = 'system' | 'pos' | 'accounting' | 'users';

const route = useRoute();
const router = useRouter();
const { can } = useRBAC();
const activeTab = ref<SettingsTab>('system');

const canManageUsers = computed(() => can('users:read'));

const validTabs: SettingsTab[] = ['system', 'pos', 'accounting', 'users'];

function normalizeQueryTab(value: unknown): SettingsTab {
  if (typeof value === 'string' && validTabs.includes(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return 'system';
}

function resolveAllowedTab(tab: SettingsTab): SettingsTab {
  if (tab === 'users' && !canManageUsers.value) return 'system';
  return tab;
}

async function syncTabFromRoute(): Promise<void> {
  const queryValue = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab;
  const requestedTab = normalizeQueryTab(queryValue);
  const allowedTab = resolveAllowedTab(requestedTab);

  if (activeTab.value !== allowedTab) {
    activeTab.value = allowedTab;
  }

  if (queryValue !== allowedTab) {
    await router.replace({
      query: {
        ...route.query,
        tab: allowedTab,
      },
    });
  }
}

watch(
  [() => route.query.tab, canManageUsers],
  () => {
    void syncTabFromRoute();
  },
  { immediate: true }
);

watch(activeTab, (tab) => {
  const allowedTab = resolveAllowedTab(tab);
  if (tab !== allowedTab) {
    activeTab.value = allowedTab;
    return;
  }

  const queryValue = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab;
  if (queryValue !== allowedTab) {
    void router.replace({
      query: {
        ...route.query,
        tab: allowedTab,
      },
    });
  }
});
</script>
