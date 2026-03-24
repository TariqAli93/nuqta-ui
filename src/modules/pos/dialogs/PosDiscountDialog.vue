<template>
  <v-dialog v-model="show" max-width="400" :fullscreen="$vuetify.display.xs">
    <v-card rounded="lg" class="pa-6">
      <v-card-title class="text-h6 pa-0">{{ t('pos.applyDiscount') }}</v-card-title>
      <v-card-text class="pa-0 mt-4">
        <MoneyInput
          v-model="localAmount"
          :label="t('pos.discountAmount')"
          grid-layout
          autofocus
          :max="subtotal"
          @keyup.enter="emit('confirm', localAmount)"
        />
      </v-card-text>
      <v-card-actions class="pa-0 mt-6 justify-end ga-2">
        <v-btn variant="text" @click="show = false">{{ t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="emit('confirm', localAmount)">{{
          t('common.apply')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { t } from '@/i18n/t';
import MoneyInput from '@/components/shared/MoneyInput.vue';

const props = defineProps<{ subtotal: number; initialAmount: number }>();
const show = defineModel<boolean>({ required: true });
const emit = defineEmits<{ confirm: [amount: number] }>();

const localAmount = ref(props.initialAmount);

watch(
  () => props.initialAmount,
  (v) => {
    localAmount.value = v;
  }
);
</script>
