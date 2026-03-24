<template>
  <v-dialog v-model="show" max-width="400" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.holdSale') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <v-text-field
          v-model="localName"
          variant="outlined"
          density="comfortable"
          :label="t('pos.holdName')"
          :placeholder="t('pos.holdNamePlaceholder')"
          autofocus
          @keyup.enter="emit('confirm', localName)"
        />
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="show = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="emit('confirm', localName)">{{
          t('pos.hold')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { t } from '@/i18n/t';

const props = defineProps<{ initialName: string }>();
const show = defineModel<boolean>({ required: true });
const emit = defineEmits<{ confirm: [name: string] }>();

const localName = ref(props.initialName);
watch(
  () => props.initialName,
  (v) => {
    localName.value = v;
  }
);
</script>
