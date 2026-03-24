<template>
  <div class="d-flex align-center ga-3">
    <v-avatar color="primary" variant="tonal" size="40">
      <v-icon>mdi-cash-register</v-icon>
    </v-avatar>
    <div>
      <div class="text-h6 font-weight-bold">تأكيد الدفع</div>
      <div class="text-body-2 text-medium-emphasis">الكاشير: {{ cashierName }}</div>
    </div>
    <v-spacer />
    <v-btn variant="text" color="error" icon @click="$emit('close')">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
defineProps<{ cashierName: string }>();

defineEmits<{ close: [] }>();
</script>
