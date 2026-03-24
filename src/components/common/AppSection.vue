<template>
  <div class="app-section">
    <div v-if="title" class="app-section__header">
      <h3 class="text-subtitle-1 font-weight-bold">{{ title }}</h3>
      <p v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.app-section {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4, 16px);
}

.app-section__header {
  padding-bottom: var(--ds-space-2, 8px);
}
</style>
