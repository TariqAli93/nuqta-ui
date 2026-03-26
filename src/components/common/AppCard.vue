<template>
  <v-card v-bind="$attrs" :elevation="elevation" variant="flat" class="border" rounded="lg">
    <slot />
  </v-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    elevation?: number;
  }>(),
  { elevation: 0 }
);
</script>
