<template>
  <div class="mb-4 mt-2 px-1">
    <v-text-field
      ref="fieldRef"
      :model-value="modelValue"
      variant="solo"
      flat
      hide-details
      single-line
      density="comfortable"
      clearable
      rounded="lg"
      bg-color="surface"
      :placeholder="t('pos.searchPlaceholder')"
      prepend-inner-icon="mdi-magnify"
      :autofocus="false"
      class="pos-search-field border rounded-lg shadow-sm"
      @update:model-value="emit('update:modelValue', $event ?? '')"
      @keydown.enter.prevent="emit('submit')"
      @keydown.down.prevent="emit('highlight-next')"
      @keydown.up.prevent="emit('highlight-prev')"
      @click:clear="emit('clear')"
    >
      <template #append-inner>
        <v-icon color="disabled" class="ms-2">mdi-barcode-scan</v-icon>
      </template>
    </v-text-field>
  </div>
</template>

<style scoped>
.pos-search-field :deep(.v-field) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pos-search-field :deep(.v-field:hover) {
  border-color: rgba(var(--v-theme-primary), 0.5);
}
.pos-search-field :deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1) !important;
}
</style>

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
