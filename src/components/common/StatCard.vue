<template>
  <v-card elevation="0" variant="flat" class="border ds-card-hover" rounded="lg">
    <v-card-text class="d-flex align-center ga-3 pa-4">
      <v-avatar :color="color" variant="tonal" size="48" rounded="lg">
        <v-icon size="24">{{ icon }}</v-icon>
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-caption text-medium-emphasis">{{ label }}</div>
        <div class="text-h6 font-weight-bold" :dir="dir">
          <slot>{{ value }}</slot>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    label: string;
    value?: string;
    color?: string;
    dir?: 'ltr' | 'rtl';
    size?: 'sm' | 'md';
  }>(),
  {
    color: 'grey',
    dir: undefined,
    size: 'md',
    value: undefined,
  }
);
</script>
