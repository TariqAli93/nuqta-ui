<template>
  <SubPageShell>
    <div class="d-flex flex-column ga-4">
      <!-- KPI summary strip -->
      <v-row dense>
        <v-col cols="12" md="6">
          <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="warning" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-package-variant-closed-minus</v-icon>
              </v-avatar>
              <div class="grow">
                <div class="text-caption text-medium-emphasis">منتجات منخفضة المخزون</div>
                <div class="text-h6 font-weight-bold">
                  {{ inventoryStore.dashboard?.lowStockCount ?? 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">منتجات وصلت لحد إعادة الطلب</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
            <v-card-text class="d-flex align-center ga-3 pa-4">
              <v-avatar color="error" variant="tonal" size="48" rounded="lg">
                <v-icon size="24">mdi-clock-alert-outline</v-icon>
              </v-avatar>
              <div class="grow">
                <div class="text-caption text-medium-emphasis">تنبيهات الصلاحية</div>
                <div class="text-h6 font-weight-bold">
                  {{ inventoryStore.expiredProducts.length }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  منتجات قاربت أو تجاوزت تاريخ الصلاحية
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Expiry Alerts Table -->
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-text class="d-flex align-center ga-3 py-3 px-4">
          <v-icon color="error" size="20">mdi-clock-alert-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold">تنبيهات الصلاحية</span>
          <v-spacer />
          <v-text-field
            v-model.number="daysAhead"
            type="number"
            label="أيام للأمام"
            density="comfortable"
            hide-details
            variant="outlined"
            style="max-width: 140px"
            min="1"
            @change="refreshAlerts"
          />
        </v-card-text>
        <v-data-table
          :headers="expiryHeaders"
          :items="inventoryStore.expiredProducts"
          :loading="inventoryStore.loadingAlerts"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :items-per-page="15"
        >
          <template #item.expiryDate="{ item }">
            <v-chip
              size="x-small"
              variant="tonal"
              :color="dateWithTime(item.expireDate) ? 'error' : 'warning'"
            >
              {{ formatDate(item.expireDate) }}
            </v-chip>
          </template>
          <template #item.daysUntilExpiry="{ item }">
            <span
              :class="
                formatDateRelative(item.expireDate) ? 'text-error font-weight-bold' : 'text-warning'
              "
            >
              {{ formatDateRelative(item.expireDate) }}
            </span>
          </template>
          <template #no-data>
            <div class="text-center py-8 text-medium-emphasis">
              <v-icon size="48" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
              <div>لا توجد تنبيهات صلاحية حالياً</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </SubPageShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { SubPageShell } from '@/components/layout';
import { dateWithTime, formatDate, formatDateRelative } from '@/utils/formatters';
import { useInventoryStore } from '@/stores/inventoryStore';

const inventoryStore = useInventoryStore();

const daysAhead = ref(30);

const expiryHeaders = [
  { title: 'المنتج', key: 'productName' },
  { title: 'الدفعة', key: 'batchNumber', width: 120 },
  { title: 'تاريخ الصلاحية', key: 'expiryDate', width: 140 },
  { title: 'المتبقي', key: 'daysUntilExpiry', align: 'center' as const, width: 100 },
  { title: 'الكمية', key: 'quantityOnHand', align: 'center' as const, width: 80 },
];

async function refreshAlerts(): Promise<void> {
  await inventoryStore.fetchExpiryAlerts(daysAhead.value);
}

onMounted(async () => {
  await Promise.all([
    inventoryStore.fetchDashboard(),
    inventoryStore.fetchExpiryAlerts(daysAhead.value),
    inventoryStore.fetchExpiringProducts(),
  ]);

  console.log('Expiry alerts:', inventoryStore.expiredProducts);
});
</script>
