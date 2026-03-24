<template>
  <v-divider class="my-4" />
  <div class="d-flex flex-wrap ga-3 justify-end">
    <v-btn
      color="primary"
      variant="flat"
      size="large"
      block
      :loading="busy"
      :disabled="!canConfirm"
      @click="$emit('confirm')"
    >
      تأكيد الدفع
    </v-btn>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canConfirm: boolean;
  busy: boolean;
}>();

defineEmits<{
  close: [];
  confirm: [];
}>();
</script>
