<template>
  <v-card>
    <div class="ds-stat-card">
      <v-avatar :color="color" variant="tonal" :size="avatarSize">
        <v-icon :size="iconSize">{{ icon }}</v-icon>
      </v-avatar>
      <div class="ds-stat-card__info">
        <div class="ds-stat-card__label">{{ label }}</div>
        <div class="ds-stat-card__value" :style="valueStyle" :dir="dir">
          <slot>{{ value }}</slot>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
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

const avatarSize = computed(() => (props.size === 'sm' ? 36 : 40));
const iconSize = computed(() => (props.size === 'sm' ? 18 : 20));
const valueStyle = computed(() => (props.size === 'sm' ? { fontSize: '0.95rem' } : undefined));
</script>
