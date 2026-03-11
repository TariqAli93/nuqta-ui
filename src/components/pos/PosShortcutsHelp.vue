<template>
  <v-dialog v-model="show" max-width="500" @keydown.escape="show = false">
    <v-card>
      <v-card-title class="text-h6 pa-4">
        {{ t('pos.keyboardShortcuts') }}
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-list density="compact">
          <v-list-item v-for="shortcut in shortcuts" :key="shortcut.key">
            <template #prepend>
              <v-chip size="small" variant="tonal" color="primary" class="me-3 font-weight-bold">
                {{ shortcut.key }}
              </v-chip>
            </template>
            <v-list-item-title>{{ shortcut.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="show = false">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';

const show = defineModel<boolean>({ default: false });

defineProps<{
  shortcuts: Array<{ key: string; label?: string }>;
}>();
</script>
