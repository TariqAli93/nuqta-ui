<template>
  <SubPageShell>
    <div class="d-flex flex-column ga-4">
      <!-- ───── Action toolbar ───── -->
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text class="d-flex align-center ga-3 flex-wrap py-3">
          <v-btn
            class="win-btn"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-magnify"
            :loading="inventoryStore.loadingReconciliation"
            @click="runCheck"
          >
            فحص فقط
          </v-btn>
          <v-btn
            class="win-btn"
            color="warning"
            variant="tonal"
            prepend-icon="mdi-wrench"
            :loading="inventoryStore.loadingReconciliation"
            @click="runRepair"
          >
            إصلاح الفروقات
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- KPI summary strip -->
      <v-row dense>
        <v-col cols="6" md="3">
          <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="primary" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-package-variant-closed</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">منتجات مفحوصة</div>
                <div class="text-h6 font-weight-bold">
                  {{ inventoryStore.reconciliation?.total ?? 0 }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="error" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-alert-circle</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">منتجات بها فرق</div>
                <div class="text-h6 font-weight-bold">
                  {{ inventoryStore.reconciliation?.items?.length ?? 0 }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="warning" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-scale-unbalanced</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">إجمالي الفروقات</div>
                <div class="text-h6 font-weight-bold">
                  {{ inventoryStore.reconciliation?.totalDrift ?? 0 }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" md="3">
          <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="info" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-check-circle</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-medium-emphasis">تم إصلاحها</div>
                <div class="text-h6 font-weight-bold">{{ inventoryStore.repairedCount }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Data table -->
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text class="pa-0">
          <v-data-table
            :headers="reconciliationHeaders"
            :items="inventoryStore.reconciliation?.items ?? []"
            :loading="inventoryStore.loadingReconciliation"
            density="comfortable"
            class="ds-table-enhanced ds-table-striped"
            :items-per-page="25"
          >
            <template #item.drift="{ item }">
              <v-chip
                size="x-small"
                :color="item.drift === 0 ? 'success' : 'error'"
                variant="tonal"
              >
                {{ item.drift }}
              </v-chip>
            </template>
            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">لا توجد فروقات حالياً</div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </div>
  </SubPageShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { SubPageShell } from '@/components/layout';
import { useInventoryStore } from '@/stores/inventoryStore';

const inventoryStore = useInventoryStore();

const reconciliationHeaders = [
  { title: 'المنتج', key: 'productName' },
  { title: 'المخزن', key: 'cachedStock', align: 'center' as const, width: 80 },
  { title: 'الدفتر', key: 'ledgerStock', align: 'center' as const, width: 80 },
  { title: 'الفرق', key: 'drift', align: 'center' as const, width: 80 },
];

async function runCheck(): Promise<void> {
  await inventoryStore.reconcileStock(false);
}

async function runRepair(): Promise<void> {
  await inventoryStore.repairDrift();
}

onMounted(async () => {
  await inventoryStore.reconcileStock(false);
});
</script>
