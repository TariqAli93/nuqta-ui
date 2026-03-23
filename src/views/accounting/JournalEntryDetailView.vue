<template>
  <PageShell>
    <PageHeader :title="entryDisplay.entryNumber" :subtitle="journalSubtitle" show-back :back-to="{ name: 'AccountingJournal' }" />

    <v-skeleton-loader v-if="accountingStore.loading" type="card" />

    <v-alert v-else-if="!accountingStore.currentEntry" type="warning" variant="tonal">
      لم يتم العثور على القيد المطلوب
    </v-alert>

    <JournalEntryViewer v-else :entry="entryDisplay" />
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { useAccountingStore } from '@/stores/accountingStore';
import JournalEntryViewer from '@/components/shared/JournalEntryViewer.vue';
import type { JournalEntryDisplay } from '@/components/shared/JournalEntryViewer.vue';

const route = useRoute();
const accountingStore = useAccountingStore();

const entryDisplay = computed((): JournalEntryDisplay => {
  const e = accountingStore.currentEntry;
  if (!e) {
    return {
      entryNumber: '',
      entryDate: '',
      description: '',
      totalAmount: 0,
    };
  }
  return {
    id: e.id,
    entryNumber: e.entryNumber ?? `#${e.id}`,
    entryDate: e.entryDate ?? '',
    description: e.description ?? '',
    sourceType: e.sourceType,
    sourceId: e.sourceId,
    isPosted: e.isPosted,
    isReversed: e.isReversed,
    totalAmount: e.totalAmount ?? 0,
    currency: e.currency,
    notes: e.notes,
    lines: (e.lines ?? []).map((line) => ({
      ...line,
      debit: line.debit ?? 0,
      credit: line.credit ?? 0,
      description: line.description ?? '',
    })),
  };
});

const journalSubtitle = computed(() => {
  const base = 'عرض تفاصيل القيد';
  if (entryDisplay.value.entryDate) {
    return `${base} لتاريخ ${entryDisplay.value.entryDate}`;
  }
  return base;
});

onMounted(async () => {
  const id = Number(route.params.id);
  if (id) {
    await accountingStore.fetchEntryById(id);
  }
});
</script>
