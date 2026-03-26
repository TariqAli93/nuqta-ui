<template>
  <v-dialog v-model="isOpen" :max-width="maxWidth" :persistent="persistent" class="ds-dialog">
    <v-card rounded="lg" elevation="0" class="border">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon v-if="icon" :icon="icon" :color="iconColor" size="24" />
        <span class="win-title">{{ title }}</span>
      </v-card-title>

      <v-card-text class="text-body-1">
        <slot>{{ message }}</slot>
      </v-card-text>

      <v-card-actions class="justify-end ga-2">
        <v-btn :disabled="loading" variant="text" class="win-ghost-btn" @click="cancel">
          {{ cancelLabel }}
        </v-btn>
        <v-btn :color="confirmColor" :loading="loading" variant="elevated" class="win-btn" elevation="0" @click="confirm">
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    icon?: string;
    iconColor?: string;
    loading?: boolean;
    persistent?: boolean;
    maxWidth?: number | string;
  }>(),
  {
    modelValue: false,
    title: 'تأكيد',
    confirmLabel: 'تأكيد',
    cancelLabel: 'إلغاء',
    confirmColor: 'error',
    icon: 'mdi-alert-circle-outline',
    iconColor: 'warning',
    loading: false,
    persistent: false,
    maxWidth: 440,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const isOpen = ref(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    isOpen.value = v;
  }
);

watch(isOpen, (v) => {
  emit('update:modelValue', v);
});

function confirm() {
  emit('confirm');
}

function cancel() {
  isOpen.value = false;
  emit('cancel');
}
</script>
