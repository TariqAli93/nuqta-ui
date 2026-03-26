<template>
  <v-card elevation="0" variant="flat" rounded="lg" class="border">
    <v-card-text class="win-card--padded">
      <v-form @submit.prevent="emit('submit')" class="win-form">
        <slot />
        <div class="d-flex justify-end ga-3 mt-4">
          <slot name="actions">
            <v-btn variant="text" class="win-ghost-btn" @click="emit('cancel')">
              {{ cancelLabel }}
            </v-btn>
            <v-btn type="submit" color="primary" class="win-btn" :loading="loading">
              {{ submitLabel }}
            </v-btn>
          </slot>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    submitLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
  }>(),
  {
    submitLabel: 'حفظ',
    cancelLabel: 'إلغاء',
    loading: false,
  }
);

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();
</script>
