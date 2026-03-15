<template>
  <v-dialog
    v-model="isOpen"
    :max-width="maxWidth"
    :persistent="persistent"
  >
    <v-card>
      <v-card-title class="d-flex align-center ga-2 pt-4 px-6">
        <v-icon v-if="icon" :icon="icon" :color="iconColor" size="24" />
        {{ title }}
      </v-card-title>

      <v-card-text class="px-6 py-3 text-body-1">
        <slot>{{ message }}</slot>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 ga-2 justify-end">
        <v-btn
          :disabled="loading"
          variant="text"
          @click="cancel"
        >
          {{ cancelLabel }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          :loading="loading"
          variant="elevated"
          @click="confirm"
        >
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
  (v) => { isOpen.value = v; }
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
