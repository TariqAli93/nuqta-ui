<template>
  <v-dialog v-model="show" max-width="400" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.moreOptions') }}</v-card-title>
      <v-list density="comfortable" class="mt-4">
        <v-list-item min-height="64" @click="emit('open-resume')">
          <template #prepend>
            <v-icon>mdi-play-circle</v-icon>
          </template>
          <v-list-item-title>{{ t('pos.resumeSale') }}</v-list-item-title>
          <v-list-item-subtitle>{{ heldCount }} {{ t('pos.heldSalesCount') }}</v-list-item-subtitle>
          <template #append>
            <v-hotkey border="0" display-mode="icon" elevation="0" keys="f3" />
          </template>
        </v-list-item>

        <v-list-item min-height="64" @click="emit('reset')">
          <template #prepend>
            <v-icon>mdi-refresh</v-icon>
          </template>
          <v-list-item-title>{{ t('pos.newSale') }}</v-list-item-title>
          <v-list-item-subtitle>{{ t('pos.startFresh') }}</v-list-item-subtitle>
          <template #append>
            <v-hotkey border="0" display-mode="icon" elevation="0" keys="f1" />
          </template>
        </v-list-item>
      </v-list>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="show = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';

const show = defineModel<boolean>({ required: true });
defineProps<{ heldCount: number }>();
const emit = defineEmits<{ 'open-resume': []; reset: [] }>();
</script>
