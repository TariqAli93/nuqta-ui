<template>
  <v-app-bar :order="2" class="mb-5 border-r-0! border-l-0!">
    <v-card-text class="pa-4">
      <v-text-field
        ref="fieldRef"
        :model-value="modelValue"
        variant="outlined"
        hide-details
        single-line
        density="comfortable"
        clearable
        :placeholder="t('pos.searchPlaceholder')"
        prepend-inner-icon="mdi-barcode-scan"
        :autofocus="false"
        @update:model-value="emit('update:modelValue', $event ?? '')"
        @keydown.enter.prevent="emit('submit')"
        @keydown.down.prevent="emit('highlight-next')"
        @keydown.up.prevent="emit('highlight-prev')"
        @click:clear="emit('clear')"
      />
    </v-card-text>
  </v-app-bar>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { t } from '@/i18n/t';

defineProps<{ modelValue: string }>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
  'highlight-next': [];
  'highlight-prev': [];
  clear: [];
}>();

// Expose the underlying field ref so PosView can resolve the <input>
const fieldRef = ref<{ $el?: HTMLElement } | null>(null);
defineExpose({ fieldRef });
</script>
