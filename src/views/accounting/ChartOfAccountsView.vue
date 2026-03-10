<template>
  <v-card flat>
    <v-data-table
      :headers="accountHeaders"
      :items="accountingStore.accounts"
      :loading="accountingStore.loading"
      density="compact"
      :items-per-page="-1"
      hide-default-footer
    >
      <template #item.balance="{ item }">{{ formatMoney(item.balance || 0) }}</template>
      <template #item.accountType="{ item }">
        <v-chip size="x-small" variant="tonal" :color="accountTypeColor(item.accountType)">
          {{ accountTypeLabel(item.accountType) }}
        </v-chip>
      </template>
      <template #no-data>
        <empty-state
          icon="mdi-chart-timeline-variant-shimmer"
          title="لا توجد حسابات"
          description="يبدو أنه لا توجد حسابات في النظام. يمكنك مراجعة الدعم الفني للاستفسار"
        ></empty-state>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { formatMoney } from '@/utils/formatters';
import { useAccountingStore } from '@/stores/accountingStore';
import { useAccountingHelpers } from '@/composables/useAccountingHelpers';
import EmptyState from '@/components/emptyState.vue';

const accountingStore = useAccountingStore();
const { accountTypeLabel, accountTypeColor } = useAccountingHelpers();

const accountHeaders = [
  { title: 'الكود', key: 'code', width: 90 },
  { title: 'الحساب', key: 'name' },
  { title: 'النوع', key: 'accountType', width: 100 },
  { title: 'الرصيد', key: 'balance', align: 'end' as const, width: 130 },
];

onMounted(async () => {
  if (accountingStore.accounts.length === 0) {
    await accountingStore.fetchAccounts();
  }
});
</script>
