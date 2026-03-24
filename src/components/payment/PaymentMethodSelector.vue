<template>
  <v-sheet rounded="lg" border class="pa-4">
    <div class="text-subtitle-1 font-weight-bold mb-3">وسيلة الدفع</div>
    <v-btn-toggle
      :model-value="modelValue"
      divided
      mandatory
      class="w-100"
      @update:model-value="$emit('update:model-value', $event)"
    >
      <v-btn
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="busy"
        rounded="0"
        variant="outlined"
        color="primary"
        class="flex-1-1 last:rounded-l-lg first:rounded-r-lg"
      >
        {{ option.label }}
      </v-btn>
    </v-btn-toggle>
  </v-sheet>
</template>

<script setup lang="ts">
import type { PaymentMethod } from '@/types/domain';
import type { PaymentMethodOption } from '@/types/payment.types';

defineProps<{
  modelValue: PaymentMethod;
  options: PaymentMethodOption[];
  busy: boolean;
}>();

defineEmits<{ 'update:model-value': [value: PaymentMethod] }>();
</script>
