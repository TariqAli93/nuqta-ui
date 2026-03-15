<template>
  <div
    class="d-flex flex-column align-center justify-center text-center py-12 px-4"
    :style="{ minHeight: minHeight }"
  >
    <v-icon
      :icon="icon"
      :size="iconSize"
      :color="iconColor"
      class="mb-4 opacity-50"
    />
    <h3 v-if="title" class="text-h6 font-weight-medium mb-2">{{ title }}</h3>
    <p v-if="description" class="text-body-2 text-medium-emphasis mb-6 max-width">
      {{ description }}
    </p>
    <slot>
      <v-btn
        v-if="actionLabel"
        :color="actionColor"
        :prepend-icon="actionIcon"
        variant="elevated"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </v-btn>
    </slot>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon?: string;
    iconSize?: number | string;
    iconColor?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    actionIcon?: string;
    actionColor?: string;
    minHeight?: string;
  }>(),
  {
    icon: 'mdi-inbox-outline',
    iconSize: 64,
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
</style>
