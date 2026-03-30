<template>
  <PageShell>
    <PageHeader :title="t('purchases.title')" :subtitle="t('purchases.subtitle')">
      <template #actions>
        <v-btn class="win-btn" color="primary" prepend-icon="mdi-plus" :to="{ name: 'PurchaseCreate' }">
          {{ t('purchases.new') }}
        </v-btn>
      </template>
    </PageHeader>

    <FilterBar>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        :placeholder="t('common.search')"
        hide-details
        variant="outlined"
        density="comfortable"
        class="flex-grow-1"
        style="min-width: 200px"
        @update:model-value="onSearch"
      />
      <v-select
        v-model="statusFilter"
        :items="statuses"
        :label="t('common.status')"
        hide-details
        variant="outlined"
        density="comfortable"
        clearable
        style="max-width: 200px"
        @update:model-value="onSearch"
      />
    </FilterBar>

    <v-card class="border" elevation="0" variant="flat" rounded="lg">
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="purchasesStore.items"
          :loading="purchasesStore.loading"
          :items-per-page="20"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          @click:row="
            (_: Event, { item }: { item: any }) =>
              router.push({ name: 'PurchaseDetails', params: { id: item.id } })
          "
        >
          <template #item.total="{ item }">
            <MoneyDisplay :amount="item.total" size="sm" />
          </template>
          <template #item.remainingAmount="{ item }">
            <MoneyDisplay
              :amount="item.remainingAmount ?? 0"
              size="sm"
              :colored="(item.remainingAmount ?? 0) === 0"
            />
          </template>
          <template #item.paymentStatus="{ item }">
            <v-chip
              v-if="item.paymentStatus"
              size="small"
              variant="tonal"
              :color="paymentStatusColor(item.paymentStatus as NonNullable<Purchase['paymentStatus']>)"
            >
              {{ paymentStatusLabel(item.paymentStatus as NonNullable<Purchase['paymentStatus']>) }}
            </v-chip>
            <span v-else class="text-disabled">—</span>
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
            {{ dateWithTime(item.createdAt) }} - ({{ formatDateRelative(item.createdAt) }})
          </template>
          <template #no-data>
            <div class="text-center py-8 text-medium-emphasis">{{ t('purchases.noPurchases') }}</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PageShell, PageHeader, FilterBar } from '@/components/layout';
import { dateWithTime, formatDateRelative } from '@/utils/formatters';
import { useRouter } from 'vue-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';
import { t } from '@/i18n/t';
import { paymentStatusLabel, paymentStatusColor } from '@/types/invoice';
import type { Purchase } from '@/types/domain';

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
  { title: t('purchases.invoiceNumber'), key: 'invoiceNumber', align: 'start' as const },
  { title: t('common.dateTime'), key: 'createdAt', align: 'start' as const },
  { title: t('purchases.total'), key: 'total', align: 'start' as const },
  { title: t('purchases.remainingAmount'), key: 'remainingAmount', align: 'start' as const },
  { title: t('common.status'), key: 'status', align: 'start' as const },
  { title: t('purchases.paymentStatus'), key: 'paymentStatus', align: 'start' as const },
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
