<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('nav.inventoryManagement') }}</div>
        <div class="win-subtitle">إدارة المخزون والحركات والمطابقة</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="refreshAll">
          {{ t('common.refresh') }}
        </v-btn>
      </div>
    </div>

    <v-tabs v-model="activeTab" bg-color="surface" class="mb-4">
      <v-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        @click="navigateToTab(tab.route)"
      >
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventoryStore';
import { t } from '@/i18n/t';

const route = useRoute();
const router = useRouter();
const inventoryStore = useInventoryStore();

const tabs = [
  { value: 'overview', label: 'نظرة عامة', route: 'InventoryOverview' },
  { value: 'movements', label: 'حركات المخزون', route: 'InventoryMovements' },
  { value: 'reconciliation', label: 'مطابقة المخزون', route: 'InventoryReconciliation' },
  { value: 'alerts', label: 'التنبيهات', route: 'InventoryAlerts' },
];

const activeTab = computed({
  get() {
    const name = route.name as string;
    const match = tabs.find((tab) => tab.route === name);
    return match?.value ?? 'overview';
  },
  set() {
    /* handled by click */
  },
});

function navigateToTab(routeName: string) {
  void router.push({ name: routeName });
}

async function refreshAll(): Promise<void> {
  await Promise.all([
    inventoryStore.fetchDashboard(),
    inventoryStore.fetchMovements({ limit: 30, offset: 0 }),
    inventoryStore.fetchExpiryAlerts(),
  ]);
}
</script>
