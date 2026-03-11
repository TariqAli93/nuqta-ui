<template>
  <div v-if="loading">
    <v-row>
      <v-col v-for="card in count" :key="card" :cols="cols">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  loading: boolean;
  count?: number;
  cols?: number | string;
}>(), {
  count: 4,
  cols: 3,
});
</script>
