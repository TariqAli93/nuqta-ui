<template>
  <v-dialog v-model="show" max-width="500" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.resumeSale') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-list v-if="heldSales.length > 0" density="comfortable">
          <v-list-item
            v-for="(sale, index) in heldSales"
            :key="index"
            min-height="64"
            @click="emit('resume', index)"
          >
            <template #prepend>
              <v-icon>mdi-pause-circle</v-icon>
            </template>
            <v-list-item-title>{{ saleName(sale, index) }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ sale.items.length }} {{ t('common.items') }} - {{ formatCurrency(sale.total) }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click.stop="emit('delete', index)"
              >
                <v-icon size="20">mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-sheet v-else class="text-center py-8 text-medium-emphasis">
          {{ t('pos.noHeldSales') }}
        </v-sheet>
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="show = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import type { HeldSale } from '@/composables/usePosHeldSales';

const show = defineModel<boolean>({ required: true });

defineProps<{
  heldSales: HeldSale[];
  saleName: (sale: HeldSale, index: number) => string;
  formatCurrency: (value: number) => string;
}>();

const emit = defineEmits<{ resume: [index: number]; delete: [index: number] }>();
</script>
