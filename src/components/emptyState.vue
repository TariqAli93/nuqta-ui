<template>
  <div class="empty-state py-5">
    <div class="empty-state__circle">
      <v-icon class="empty-state__icon" color="primary">{{ icon }}</v-icon>
    </div>
    <div class="empty-state__title">{{ title }}</div>
    <div class="empty-state__desc">{{ description }}</div>
    <v-btn
      v-if="actionLabel"
      color="primary"
      variant="tonal"
      :to="actionTo"
      :prepend-icon="actionIcon"
      class="empty-state__action"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </v-btn>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  actionIcon?: string;
}>();

defineEmits<{
  action: [];
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  text-align: center;
}

.empty-state__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.08);
  margin-bottom: 24px;
  transition: transform 0.25s ease;
}

.empty-state__circle:hover {
  transform: scale(1.06);
}

.empty-state__icon {
  font-size: 44px !important;
  opacity: 0.85;
}

.empty-state__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.75);
  margin-bottom: 4px;
}

.empty-state__desc {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.45);
  max-width: 320px;
  line-height: 1.6;
}

.empty-state__action {
  margin-top: 16px;
}
</style>
