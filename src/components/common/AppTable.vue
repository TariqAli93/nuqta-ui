<template>
  <v-card class="border" elevation="0" variant="flat" rounded="lg">
    <v-card-title
      v-if="title || $slots.actions"
      class="d-flex align-center justify-space-between"
      style="padding: var(--ds-card-py) var(--ds-card-px) var(--ds-space-2)"
    >
      <span v-if="title" class="win-title">{{ title }}</span>
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
