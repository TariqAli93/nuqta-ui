<template>
  <v-dialog v-model="show" max-width="600" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.selectCustomer') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-text-field
          :model-value="search"
          variant="outlined"
          density="comfortable"
          :placeholder="t('pos.searchCustomers')"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          @update:model-value="emit('update:search', $event ?? '')"
        />

        <v-list v-if="!loading && customers.length > 0" density="comfortable" class="mt-4">
          <v-list-item
            v-for="customer in customers"
            :key="customer.id"
            :active="selectedId === customer.id"
            min-height="56"
            @click="customer.id && emit('select', customer.id)"
          >
            <v-list-item-title>{{ customer.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ customer.phone || t('pos.noPhone') }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-sheet v-else-if="loading" class="d-flex align-center justify-center py-8">
          <v-progress-circular indeterminate />
        </v-sheet>

        <v-sheet v-else class="text-center py-8 text-medium-emphasis">
          {{ t('pos.noCustomers') }}
        </v-sheet>
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="emit('clear')">{{ t('common.clear') }}</v-btn>
        <v-btn variant="text" @click="show = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import type { Customer } from '@/types/domain';

const show = defineModel<boolean>({ required: true });

defineProps<{
  customers: Customer[];
  selectedId: number | null;
  search: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: number];
  clear: [];
  'update:search': [value: string];
}>();
</script>
