<template>
  <v-card v-bind="$attrs">
    <slot />
  </v-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    elevation?: number;
  }>(),
  { elevation: 1 }
);
</script>
