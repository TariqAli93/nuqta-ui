<template>
  <v-card flat rounded="xl" elevation="1">
    <v-card-text class="pa-6">
      <v-form @submit.prevent="emit('submit')">
        <slot />
        <div class="d-flex justify-end ga-3 mt-6">
          <slot name="actions">
            <v-btn variant="text" @click="emit('cancel')">
              {{ cancelLabel }}
            </v-btn>
            <v-btn type="submit" color="primary" :loading="loading">
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
