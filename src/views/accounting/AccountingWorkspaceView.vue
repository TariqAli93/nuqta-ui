<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('nav.accounting') }}</div>
        <div class="win-subtitle">إدارة الحسابات والتقارير المالية</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="refreshAll">
          {{ t('common.refresh') }}
        </v-btn>
      </div>
    </div>

    <v-tabs v-model="activeTab" bg-color="surface" show-arrows class="mb-4">
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
import { useAccountingStore } from '@/stores/accountingStore';
import { t } from '@/i18n/t';

const route = useRoute();
const router = useRouter();
const accountingStore = useAccountingStore();

const tabs = [
  { value: 'accounts', label: 'دليل الحسابات', route: 'AccountingAccounts' },
  { value: 'journal', label: 'القيود اليومية', route: 'AccountingJournal' },
  { value: 'posting', label: 'الترحيل', route: 'AccountingPosting' },
  { value: 'trial', label: 'ميزان المراجعة', route: 'AccountingTrialBalance' },
  { value: 'pnl', label: 'الأرباح والخسائر', route: 'AccountingProfitLoss' },
  { value: 'balance', label: 'الميزانية العمومية', route: 'AccountingBalanceSheet' },
];

const activeTab = computed({
  get() {
    const name = route.name as string;
    const match = tabs.find((tab) => tab.route === name);
    return match?.value ?? 'accounts';
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
    accountingStore.fetchAccounts(true),
    accountingStore.fetchJournalEntries({ limit: 30, offset: 0 }),
    accountingStore.fetchTrialBalance(),
    accountingStore.fetchProfitLoss(),
    accountingStore.fetchBalanceSheet(),
  ]);
}
</script>
