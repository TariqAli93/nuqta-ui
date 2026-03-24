<template>
  <v-card>
    <v-card-title
      v-if="title || $slots.actions"
      class="d-flex align-center justify-space-between pa-4"
    >
      <span v-if="title" class="text-subtitle-1 font-weight-bold">{{ title }}</span>
      <v-spacer />
      <slot name="actions" />
    </v-card-title>

    <slot name="filters" />

    <v-card-text class="pa-0">
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>
