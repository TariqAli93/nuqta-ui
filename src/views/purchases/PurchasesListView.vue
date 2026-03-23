<template>
  <div class="win-page">
    <div class="ds-page-header-block">
      <div>
        <div class="win-title">{{ t('purchases.title') }}</div>
        <div class="win-subtitle">{{ t('purchases.subtitle') }}</div>
      </div>
      <div class="ds-page-header__actions">
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'PurchaseCreate' }">
          {{ t('purchases.new') }}
        </v-btn>
      </div>
    </div>

    <v-card flat class="ds-filter-bar">
      <v-row dense>
        <v-col cols="12" sm="8">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            :placeholder="t('common.search')"
            hide-details
            variant="outlined"
            density="comfortable"
            @update:model-value="onSearch"
          />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="statusFilter"
            :items="statuses"
            :label="t('common.status')"
            hide-details
            variant="outlined"
            density="comfortable"
            clearable
            @update:model-value="onSearch"
          />
        </v-col>
      </v-row>
    </v-card>

    <v-card flat>
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="purchasesStore.items"
          :loading="purchasesStore.loading"
          :items-per-page="20"
          class="ds-table-enhanced ds-table-striped"
          @click:row="
            (_: Event, { item }: { item: any }) =>
              router.push({ name: 'PurchaseDetails', params: { id: item.id } })
          "
        >
          <template #item.total="{ item }">
            <MoneyDisplay :amount="item.total" size="sm" />
          </template>
          <template #item.paidAmount="{ item }">
            <MoneyDisplay :amount="item.paidAmount ?? 0" size="sm" colored />
          </template>
          <template #item.status="{ item }">
            <v-chip
              :color="
                item.status === 'completed'
                  ? 'success'
                  : item.status === 'pending'
                    ? 'warning'
                    : 'error'
              "
              size="small"
              variant="tonal"
            >
              {{ statusLabel(item.status) }}
            </v-chip>
          </template>
          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #no-data>
            <div class="text-center py-8 text-medium-emphasis">{{ t('purchases.noPurchases') }}</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatDate } from '@/utils/formatters';
import { useRouter } from 'vue-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';
import { t } from '@/i18n/t';

const router = useRouter();
const purchasesStore = usePurchasesStore();
const search = ref('');
const statusFilter = ref<string | null>(null);

const statuses = [
  { title: t('purchases.statusCompleted'), value: 'completed' },
  { title: t('purchases.statusPending'), value: 'pending' },
  { title: t('purchases.statusCancelled'), value: 'cancelled' },
];

const headers = [
  { title: t('purchases.invoiceNumber'), key: 'invoiceNumber' },
  { title: t('common.date'), key: 'createdAt', width: '140px' },
  { title: t('purchases.total'), key: 'total', align: 'end' as const },
  { title: t('purchases.paidAmount'), key: 'paidAmount', align: 'end' as const },
  { title: t('common.status'), key: 'status', width: '120px' },
];

onMounted(() => {
  purchasesStore.fetchPurchases();
});

function onSearch() {
  purchasesStore.fetchPurchases({
    search: search.value || undefined,
    status: statusFilter.value || undefined,
  });
}

function statusLabel(s: string | undefined): string {
  if (!s) return '—';
  return (
    {
      completed: t('purchases.statusCompleted'),
      pending: t('purchases.statusPending'),
      cancelled: t('purchases.statusCancelled'),
    } as Record<string, string>
  )[s] ?? s;
}
</script>
