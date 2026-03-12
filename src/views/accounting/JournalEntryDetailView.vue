<template>
  <v-container>
    <v-btn variant="text" prepend-icon="mdi-arrow-right" class="mb-3" @click="goBack">
      العودة للقيود
    </v-btn>

    <v-skeleton-loader v-if="accountingStore.loading" type="card" />

    <v-alert v-else-if="!accountingStore.currentEntry" type="warning" variant="tonal">
      لم يتم العثور على القيد المطلوب
    </v-alert>

    <JournalEntryViewer v-else :entry="entryDisplay" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccountingStore } from '@/stores/accountingStore';
import JournalEntryViewer from '@/components/shared/JournalEntryViewer.vue';
import type { JournalEntryDisplay } from '@/components/shared/JournalEntryViewer.vue';

const route = useRoute();
const router = useRouter();
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
    lines: e.lines ?? [],
  };
});

function goBack(): void {
  void router.push({ name: 'AccountingJournal' });
}

onMounted(async () => {
  const id = Number(route.params.id);
  if (id) {
    await accountingStore.fetchEntryById(id);
  }
});
</script>
