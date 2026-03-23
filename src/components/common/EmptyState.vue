<template>
  <div
    class="d-flex flex-column align-center justify-center text-center py-12 px-4"
    :style="{ minHeight: minHeight }"
  >
    <div class="empty-state__circle mb-6">
      <v-icon
        :icon="icon"
        :size="iconSize"
        :color="iconColor"
        class="opacity-85"
      />
    </div>
    <h3 v-if="title" class="text-h6 font-weight-medium mb-2">{{ title }}</h3>
    <p v-if="description" class="text-body-2 text-medium-emphasis mb-6 max-width">
      {{ description }}
    </p>
    <slot>
      <v-btn
        v-if="actionLabel"
        :color="actionColor"
        :prepend-icon="actionIcon"
        :to="actionTo"
        variant="tonal"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </v-btn>
    </slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    iconSize?: number | string;
    iconColor?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    actionIcon?: string;
    actionColor?: string;
    actionTo?: string;
    minHeight?: string;
  }>(),
  {
    icon: 'mdi-inbox-outline',
    iconSize: 44,
    iconColor: 'primary',
    actionColor: 'primary',
    actionIcon: 'mdi-plus',
    minHeight: '300px',
  }
);

const emit = defineEmits<{ (e: 'action'): void }>();
</script>

<style scoped>
.max-width {
  max-width: 400px;
}

.empty-state__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.08);
  transition: transform 0.25s ease;
}

.empty-state__circle:hover {
  transform: scale(1.06);
}
</style>
