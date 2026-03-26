<template>
  <div class="d-flex flex-column ga-4">
    <div v-if="title" class="pb-2">
      <h3 class="win-title">{{ title }}</h3>
      <p v-if="subtitle" class="win-subtitle mt-1">{{ subtitle }}</p>
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
