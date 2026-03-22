<template>
  <v-card>
    <div class="nq-stat-card">
      <v-avatar :color="color" variant="tonal" :size="40">
        <v-icon :size="20">{{ icon }}</v-icon>
      </v-avatar>
      <div class="nq-stat-card__info">
        <div class="nq-stat-card__label">{{ label }}</div>
        <div class="nq-stat-card__value">
          <slot>{{ value }}</slot>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  value?: string | number;
  color?: string;
}>();
</script>
