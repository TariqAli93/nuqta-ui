<template>
  <v-card elevation="0" variant="flat" class="border" rounded="lg">
    <v-card-title
      v-if="title"
      class="text-body-1 font-weight-bold d-flex align-center px-4 pt-4 pb-2"
    >
      {{ title }}
    </v-card-title>
    <v-card-text class="pa-0">
      <v-data-table
        :headers="headers"
        :items="entries"
        :loading="loading"
        density="comfortable"
        :items-per-page="itemsPerPage"
        class="ledger-table ds-table-enhanced ds-table-striped"
      >
        <template #item.createdAt="{ item }">
          {{ dateWithTime(item.createdAt) }} - ({{ formatDateRelative(item.createdAt) }})
        </template>

        <template #item.transactionType="{ item }">
          <v-chip :color="typeColor(item.transactionType)" size="small" variant="tonal" label>
            <v-icon start size="14">{{ typeIcon(item.transactionType) }}</v-icon>
            {{ typeLabel(item.transactionType) }}
          </v-chip>
        </template>

        <template #item.amount="{ item }">
          <span
            class="d-inline-flex align-center ga-1"
            :class="item.amount > 0 ? 'text-error' : 'text-success'"
          >
            <v-icon size="14">{{ item.amount > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
            <MoneyDisplay :amount="Math.abs(item.amount)" size="sm" />
          </span>
        </template>

        <template #item.balanceAfter="{ item }">
          <span class="font-weight-bold">
            <MoneyDisplay :amount="item.balanceAfter" size="sm" />
          </span>
        </template>

        <template #item.notes="{ item }">
          <span :class="item.notes ? '' : 'text-disabled'">{{ item.notes || '—' }}</span>
        </template>

        <template #no-data>
          <div class="text-center py-10 text-medium-emphasis">
            <v-icon size="40" class="mb-2 text-disabled">mdi-book-open-page-variant-outline</v-icon>
            <div>لا توجد حركات</div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDateRelative, dateWithTime } from '@/utils/formatters';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';

export interface LedgerEntry {
  id?: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  notes?: string | null;
  createdAt?: string;
  saleId?: number;
  purchaseId?: number;
  paymentId?: number;
}

const props = withDefaults(
  defineProps<{
    entries: LedgerEntry[];
    title?: string;
    loading?: boolean;
    entityType?: 'customer' | 'supplier';
    itemsPerPage?: number;
  }>(),
  {
    title: '',
    loading: false,
    entityType: 'customer',
    itemsPerPage: 15,
  }
);

const TYPE_LABELS: Record<string, string> = {
  sale: 'فاتورة',
  invoice: 'فاتورة',
  payment: 'دفعة',
  return: 'مرتجع',
  adjustment: 'تعديل',
  opening: 'رصيد افتتاحي',
  refund: 'استرداد',
};

const TYPE_COLORS: Record<string, string> = {
  sale: 'error',
  invoice: 'error',
  payment: 'success',
  return: 'warning',
  adjustment: 'info',
  opening: 'grey',
  refund: 'warning',
};

const TYPE_ICONS: Record<string, string> = {
  sale: 'mdi-receipt-text-outline',
  invoice: 'mdi-receipt-text-outline',
  payment: 'mdi-cash-check',
  return: 'mdi-cash-refund',
  adjustment: 'mdi-scale-balance',
  opening: 'mdi-book-open-outline',
  refund: 'mdi-cash-refund',
};

const headers = computed(() => [
  { title: 'التاريخ', key: 'createdAt', width: '140px' },
  { title: 'النوع', key: 'transactionType', width: '80px' },
  { title: 'المبلغ', key: 'amount', align: 'start' as const, width: '100px' },
  { title: 'الرصيد', key: 'balanceAfter', align: 'start' as const, width: '100px' },
  { title: 'ملاحظات', key: 'notes', sortable: false, width: '250px', align: 'start' as const },
]);

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? 'grey';
}

function typeIcon(type: string): string {
  return TYPE_ICONS[type] ?? 'mdi-circle-small';
}
</script>
