<template>
  <PageShell>
    <PageHeader
      :title="entryDisplay?.entryNumber ?? ''"
      :subtitle="journalSubtitle"
      show-back
      :back-to="{ name: 'AccountingJournal' }"
    />

    <div class="d-flex flex-column ga-4">
      <v-skeleton-loader v-if="accountingStore.loading" type="card" />

      <v-alert v-else-if="!entryDisplay" type="warning" variant="tonal">
        لم يتم العثور على القيد المطلوب
      </v-alert>

      <v-card v-else elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text>
          <JournalEntryViewer :entry="entryDisplay" />
        </v-card-text>
      </v-card>
    </div>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { useAccountingStore } from '@/stores/accountingStore';
import JournalEntryViewer from '@/components/shared/JournalEntryViewer.vue';
import type { JournalEntryDisplay } from '@/components/shared/JournalEntryViewer.vue';

const route = useRoute();
const accountingStore = useAccountingStore();

const accountsById = computed(() => {
  const map = new Map<number, string>();
  for (const account of accountingStore.accounts) {
    if (typeof account.id === 'number') {
      map.set(account.id, account.name);
    }
  }
  return map;
});

const entryDisplay = computed((): JournalEntryDisplay | null => {
  const e = accountingStore.currentEntry;
  if (!e) return null;

  return {
    id: e.id,
    entryNumber: e.entryNumber ?? `#${e.id}`,
    entryDate: e.entryDate ?? '',
    description: e.description ?? '',
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    isPosted: e.isPosted,
    isReversed: e.isReversed,
    currency: e.currency,
    notes: e.notes,
    lines: (e.lines ?? []).map((l) => ({
      id: l.id,
      accountId: l.accountId,
      accountName: accountsById.value.get(l.accountId) ?? `حساب #${l.accountId}`,
      debit: l.debit ?? 0,
      credit: l.credit ?? 0,
      description: l.description ?? '',
    })),
  };
});

const journalSubtitle = computed(() => {
  const base = 'عرض تفاصيل القيد';
  if (entryDisplay.value?.entryDate) {
    return `${base} لتاريخ ${entryDisplay.value.entryDate}`;
  }
  return base;
});

watch(
  () => route.params.id,
  async () => {
    const id = Number(route.params.id);
    if (!Number.isFinite(id)) return;
    await accountingStore.fetchAccounts();
    await accountingStore.fetchEntryById(id);
  },
  { immediate: true }
);
</script>
