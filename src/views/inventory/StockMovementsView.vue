<template>
  <SubPageShell>
    <v-card elevation="0" variant="flat" class="border" rounded="lg">
      <v-card-text class="d-flex align-center ga-3 flex-wrap">
        <AppDateInput
          v-model="dateFrom"
          label="من تاريخ"
          density="comfortable"
          hide-details
          variant="outlined"
          style="max-width: 200px"
          clearable
        />
        <AppDateInput
          v-model="dateTo"
          label="إلى تاريخ"
          density="comfortable"
          hide-details
          variant="outlined"
          style="max-width: 200px"
          clearable
        />
        <v-select
          v-model="movementTypeFilter"
          :items="movementTypes"
          label="نوع الحركة"
          density="comfortable"
          hide-details
          variant="outlined"
          style="max-width: 180px"
          clearable
        />
        <v-btn
          class="win-btn"
          color="primary"
          variant="tonal"
          :loading="inventoryStore.loadingMovements"
          @click="refresh"
        >
          تصفية
        </v-btn>
      </v-card-text>

      <v-card-text class="pa-0">
        <v-data-table
          :headers="movementHeaders"
          :items="inventoryStore.movements"
          :loading="inventoryStore.loadingMovements"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
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
            <v-chip
              size="x-small"
              variant="tonal"
              :color="reasonSignedColor(item.sourceType || '')"
            >
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
            <div class="text-center py-8 text-medium-emphasis">لا توجد حركات مخزون بعد.</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </SubPageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { SubPageShell } from '@/components/layout';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import { formatDate } from '@/utils/formatters';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useInventoryHelpers } from '@/composables/useInventoryHelpers';
import { useMovementTable } from '@/composables/useMovementTable';

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
