<template>
  <PageShell>
    <PageHeader :title="t('nav.accounting')" subtitle="إدارة الحسابات والتقارير المالية">
      <template #actions>
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="refreshAll">
          {{ t('common.refresh') }}
        </v-btn>
      </template>
    </PageHeader>

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
  </PageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountingStore } from '@/stores/accountingStore';
import { t } from '@/i18n/t';
import { PageShell, PageHeader } from '@/components/layout';

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
