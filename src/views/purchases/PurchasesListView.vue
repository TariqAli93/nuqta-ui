<template>
  <div class="nq-page">
    <PageHeader title="المشتريات">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'PurchaseCreate' }">
          فاتورة مشتريات جديدة
        </v-btn>
      </template>
    </PageHeader>

    <v-card class="nq-table-card">
      <div class="nq-filter-bar">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="بحث..."
          hide-details
          style="flex: 1 1 280px; min-width: 180px"
          @update:model-value="onSearch"
        />
        <v-select
          v-model="statusFilter"
          :items="statuses"
          label="الحالة"
          hide-details
          clearable
          style="flex: 0 1 200px; min-width: 160px"
          @update:model-value="onSearch"
        />
      </div>

      <v-data-table
        :headers="headers"
        :items="purchasesStore.items"
        :loading="purchasesStore.loading"
        :items-per-page="20"
        density="comfortable"
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
          <EmptyState
            icon="mdi-cart-arrow-down"
            title="لا توجد مشتريات"
            description="ستظهر المشتريات هنا بعد إنشاء فاتورة مشتريات جديدة"
            min-height="200px"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatDate } from '@/utils/formatters';
import { useRouter } from 'vue-router';
import { usePurchasesStore } from '../../stores/purchasesStore';
import MoneyDisplay from '../../components/shared/MoneyDisplay.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';

const router = useRouter();
const purchasesStore = usePurchasesStore();
const search = ref('');
const statusFilter = ref<string | null>(null);

const statuses = [
  { title: 'مكتمل', value: 'completed' },
  { title: 'معلق', value: 'pending' },
  { title: 'ملغي', value: 'cancelled' },
];

const headers = [
  { title: 'رقم الفاتورة', key: 'invoiceNumber' },
  { title: 'التاريخ', key: 'createdAt', width: '140px' },
  { title: 'الإجمالي', key: 'total', align: 'end' as const },
  { title: 'المدفوع', key: 'paidAmount', align: 'end' as const },
  { title: 'الحالة', key: 'status', width: '120px' },
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
  return ({ completed: 'مكتمل', pending: 'معلق', cancelled: 'ملغي' } as Record<string, string>)[s] ?? s;
}
</script>
