<template>
  <v-sheet rounded="lg" border class="pa-4">
    <div class="d-flex align-center justify-space-between">
      <div class="text-subtitle-1 font-weight-bold">الخصم الإضافي</div>
      <v-btn size="small" variant="text" :disabled="busy" @click="$emit('toggle')">
        {{ modelValue ? 'إخفاء' : 'إضافة خصم' }}
      </v-btn>
    </div>

    <v-expand-transition>
      <v-text-field
        v-if="modelValue"
        :model-value="discountInput"
        variant="outlined"
        hide-details
        label="قيمة الخصم"
        class="mt-3"
        @update:model-value="$emit('update:discountInput', $event)"
        @focus="$emit('focusField')"
        @blur="$emit('blurField')"
      />
    </v-expand-transition>
  </v-sheet>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  discountInput: string;
  busy: boolean;
}>();

defineEmits<{
  toggle: [];
  'update:discountInput': [value: string];
  focusField: [];
  blurField: [];
}>();
</script>
