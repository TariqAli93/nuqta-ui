<template>
  <div v-if="loading">
    <v-skeleton-loader
      v-for="row in rows"
      :key="row"
      type="table-row"
      class="mb-1"
    />
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean;
  rows?: number;
}>(), {
  rows: 5,
});
</script>
