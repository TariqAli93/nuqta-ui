<template>
  <div class="nq-page-header">
    <div>
      <h1 class="nq-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="nq-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="nq-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>
