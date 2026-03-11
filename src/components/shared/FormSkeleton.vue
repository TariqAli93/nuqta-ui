<template>
  <div v-if="loading">
    <v-skeleton-loader
      v-for="field in fields"
      :key="field"
      type="text"
      class="mb-4"
    />
    <v-skeleton-loader type="button" class="mt-2" />
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean;
  fields?: number;
}>(), {
  fields: 4,
});
</script>
