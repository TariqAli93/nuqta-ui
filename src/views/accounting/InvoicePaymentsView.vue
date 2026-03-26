<template>
  <SubPageShell>
    <v-tabs v-model="activeTab" color="primary" bg-color="transparent" class="mb-4">
    <v-tab value="all">الكل</v-tab>
    <v-tab value="posted">مرحل</v-tab>
    <v-tab value="unposted">غير مرحل</v-tab>
  </v-tabs>

  <v-card elevation="0" variant="flat" class="border" rounded="lg">
    <v-card-text class="pa-0">
      <v-data-table-server
        v-model:items-per-page="options.itemsPerPage"
        v-model:page="options.page"
        :headers="headers"
        :items="store.journalEntries"
        :items-length="store.journalTotal"
        :loading="loading"
        density="comfortable"
        class="ds-table-enhanced ds-table-striped"
        @update:options="onOptionsUpdate"
      >
        <template #item.entryNumber="{ item }">
          <span class="font-weight-medium text-primary">{{ item.entryNumber }}</span>
        </template>

        <template #item.entryDate="{ item }">
          {{ formatDate(item.entryDate) }}
        </template>

        <template #item.totalAmount="{ item }">
          {{ formatMoney(item.totalAmount, item.currency) }}
        </template>

        <template #item.isPosted="{ item }">
          <v-chip size="small" :color="item.isPosted ? 'success' : 'warning'" variant="tonal">
            {{ item.isPosted ? 'مرحل' : 'غير مرحل' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            v-if="!item.isPosted"
            variant="text"
            color="success"
            size="small"
            :loading="actionLoading === item.id"
            @click="postEntry(item)"
            class="me-2"
          >
            ترحيل
          </v-btn>
          <v-btn
            v-if="item.isPosted"
            variant="text"
            color="warning"
            size="small"
            :loading="actionLoading === item.id"
            @click="unpostEntry(item)"
            class="me-2"
          >
            إلغاء الترحيل
          </v-btn>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            :to="{ name: 'JournalEntryDetail', params: { id: item.id } }"
          >
            عرض التفاصيل
          </v-btn>
        </template>

        <template #no-data>
          <div class="text-center py-6 text-medium-emphasis">لا توجد قيود لعرضها</div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>
  </SubPageShell>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { SubPageShell } from '@/components/layout';
import { useAccountingStore } from '@/stores/accountingStore';
import { postingClient } from '@/api/endpoints/posting';
import { notifyError, notifySuccess } from '@/utils/notify';
import { toUserMessage } from '@/utils/errorMessage';
import { formatDate, formatMoney } from '@/utils/formatters';

const store = useAccountingStore();

const activeTab = ref<'all' | 'posted' | 'unposted'>('all');
const loading = ref(false);
const actionLoading = ref<number | null>(null);

const options = ref({
  page: 1,
  itemsPerPage: 10,
});

const headers = [
  { title: 'رقم القيد', key: 'entryNumber' },
  { title: 'التاريخ', key: 'entryDate' },
  { title: 'الوصف', key: 'description' },
  { title: 'المبلغ الإجمالي', key: 'totalAmount' },
  { title: 'الحالة', key: 'isPosted' },
  { title: 'إجراءات', key: 'actions', sortable: false, align: 'end' as const },
];

async function loadData() {
  loading.value = true;

  let isPosted: boolean | undefined = undefined;
  if (activeTab.value === 'posted') isPosted = true;
  if (activeTab.value === 'unposted') isPosted = false;

  await store.fetchJournalEntries({
    isPosted,
    limit: options.value.itemsPerPage,
    offset: (options.value.page - 1) * options.value.itemsPerPage,
  });

  loading.value = false;
}

async function postEntry(entry: any) {
  if (!confirm(`هل أنت متأكد من ترحيل القيد رقم ${entry.entryNumber}؟`)) return;

  actionLoading.value = entry.id;
  try {
    const result = await postingClient.postIndividualEntry(entry.id);
    if (!result.ok) throw new Error(result.error.message || 'تعذر ترحيل القيد');

    notifySuccess(`تم ترحيل القيد ${entry.entryNumber} بنجاح`);
    await loadData();
  } catch (err: any) {
    notifyError(toUserMessage(err));
  } finally {
    actionLoading.value = null;
  }
}

async function unpostEntry(entry: any) {
  if (!confirm(`هل أنت متأكد من إلغاء ترحيل القيد رقم ${entry.entryNumber}؟`)) return;

  actionLoading.value = entry.id;
  try {
    const result = await postingClient.unpostIndividualEntry(entry.id);
    if (!result.ok) throw new Error(result.error.message || 'تعذر إلغاء ترحيل القيد');

    notifySuccess(`تم إلغاء ترحيل القيد ${entry.entryNumber} بنجاح`);
    await loadData();
  } catch (err: any) {
    notifyError(toUserMessage(err));
  } finally {
    actionLoading.value = null;
  }
}

function onOptionsUpdate(newOptions: any) {
  options.value = newOptions;
  loadData();
}

watch(activeTab, () => {
  options.value.page = 1; // Reset to first page when changing tabs
  loadData();
});

onMounted(() => {
  void store.fetchAccountingSettings();
  loadData();
});
</script>
