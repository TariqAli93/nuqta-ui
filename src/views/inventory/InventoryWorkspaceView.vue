<template>
  <PageShell>
    <PageHeader :title="t('nav.inventoryManagement')" subtitle="إدارة المخزون والحركات والمطابقة">
      <template #actions>
        <div class="flex items-center gap-4">
          <!-- <div id="tabs">
            <v-tabs v-model="activeTab" bg-color="surface">
              <v-tab
                v-for="tab in tabs"
                :key="tab.value"
                :value="tab.value"
                @click="navigateToTab(tab.route)"
              >
                {{ tab.label }}
              </v-tab>
            </v-tabs>
          </div> -->

          <div id="refresh">
            <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="refreshAll">
              {{ t('common.refresh') }}
            </v-btn>
          </div>
        </div>
      </template>
    </PageHeader>

    <router-view />
  </PageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInventoryStore } from '@/stores/inventoryStore';
import { t } from '@/i18n/t';
import { PageShell, PageHeader } from '@/components/layout';

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
