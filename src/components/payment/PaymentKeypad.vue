<template>
  <v-sheet rounded="lg" border class="pa-4">
    <div class="text-subtitle-1 font-weight-bold mb-3">لوحة الأرقام</div>
    <div class="grid grid-cols-[1fr_3fr] gap-4">
      <!-- Denomination quick-select -->
      <div v-if="denominations?.length" class="d-flex flex-column ga-2 align-stretch">
        <v-btn
          v-for="d in denominations"
          :key="d"
          class="grow"
          variant="tonal"
          color="secondary"
          size="large"
          :disabled="busy"
          @mousedown.prevent
          @click="$emit('denomination', d)"
        >
          {{ d.toLocaleString('en-US') }}
        </v-btn>
      </div>
      <!-- Number keypad -->
      <div class="grow grid grid-cols-3 gap-2">
        <v-btn
          v-for="key in keys"
          :key="key.id"
          variant="flat"
          color="primary"
          size="large"
          :disabled="busy"
          @mousedown.prevent
          @click="$emit('press', key.id)"
        >
          <v-icon v-if="key.id === 'backspace'" size="22">mdi-backspace-outline</v-icon>
          <span v-else>{{ key.label }}</span>
        </v-btn>
      </div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import type { PaymentKeypadKey } from '@/types/payment.types';

defineProps<{
  keys: PaymentKeypadKey[];
  busy: boolean;
  denominations?: number[];
}>();

defineEmits<{ press: [key: string]; denomination: [amount: number] }>();
</script>
