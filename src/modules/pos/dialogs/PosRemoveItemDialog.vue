<template>
  <v-dialog v-model="show" max-width="420" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.removeItemTitle') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">{{ t('pos.removeItemText') }}</v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="emit('cancel')">{{ t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" @click="emit('confirm')">{{
          t('common.delete')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';

const show = defineModel<boolean>({ required: true });
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>
