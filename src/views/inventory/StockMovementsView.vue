<template>
  <v-card class="nq-table-card">
    <div class="nq-filter-bar">
      <v-text-field
        v-model="dateFrom"
        type="date"
        label="من تاريخ"
        hide-details
        clearable
        style="flex: 0 1 200px; min-width: 160px"
      />
      <v-text-field
        v-model="dateTo"
        type="date"
        label="إلى تاريخ"
        hide-details
        clearable
        style="flex: 0 1 200px; min-width: 160px"
      />
      <v-select
        v-model="movementTypeFilter"
        :items="movementTypes"
        label="نوع الحركة"
        hide-details
        clearable
        style="flex: 0 1 180px; min-width: 140px"
      />
      <v-btn
        color="primary"
        variant="tonal"
        :loading="inventoryStore.loadingMovements"
        @click="refresh"
      >
        تصفية
      </v-btn>
    </div>

    <v-data-table
      :headers="movementHeaders"
      :items="inventoryStore.movements"
      :loading="inventoryStore.loadingMovements"
      density="comfortable"
      :items-per-page="25"
    >
      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template #item.movementType="{ item }">
        <v-chip size="x-small" variant="tonal" :color="movementColor(item.movementType)">
          {{ movementLabel(item.movementType) }}
        </v-chip>
      </template>
      <template #item.reason="{ item }">
        <v-chip size="x-small" variant="tonal" :color="reasonSignedColor(item.reason)">
          {{ reasonLabel(item.reason) || '—' }}
        </v-chip>
      </template>
      <template #item.sourceType="{ item }">
        <v-chip size="x-small" variant="tonal" :color="reasonSignedColor(item.sourceType || '')">
          {{ reasonLabel(item.sourceType || '') }}
        </v-chip>
      </template>
      <template #item.quantityBase="{ item }">
        <span :class="movementSignedClass(item.movementType)">
          {{ movementSignedPrefix(item.movementType) }}{{ item.quantityBase }}
        </span>
      </template>
      <template #item.productName="{ item }">{{ getProductName(item.productId) }}</template>
      <template #no-data>
        <EmptyState
          icon="mdi-swap-horizontal"
          title="لا توجد حركات مخزون بعد"
          min-height="200px"
        />
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { formatDate } from '@/utils/formatters';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useInventoryHelpers } from '@/composables/useInventoryHelpers';
import { useMovementTable } from '@/composables/useMovementTable';
import EmptyState from '@/components/common/EmptyState.vue';

const inventoryStore = useInventoryStore();
const {
  movementLabel,
  movementColor,
  movementSignedPrefix,
  movementSignedClass,
  reasonLabel,
  reasonSignedColor,
} = useInventoryHelpers();
const { movementHeaders, getProductName, ensureProducts } = useMovementTable();

const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const movementTypeFilter = ref<string | null>(null);

const movementTypes = [
  { title: 'الكل', value: '' },
  { title: 'دخول', value: 'in' },
  { title: 'خروج', value: 'out' },
  { title: 'تعديل', value: 'adjust' },
];

async function refresh(): Promise<void> {
  await inventoryStore.fetchMovements({
    movementType: movementTypeFilter.value || undefined,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
    limit: 50,
    offset: 0,
  });
}

onMounted(async () => {
  await Promise.all([inventoryStore.fetchMovements({ limit: 50, offset: 0 }), ensureProducts()]);
});
</script>
