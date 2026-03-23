<template>
  <div class="ds-page-header-block">
    <div class="d-flex align-center ga-3">
      <v-btn
        v-if="showBack"
        icon="mdi-arrow-right"
        variant="text"
        size="small"
        @click="onBack"
      />
      <div>
        <div class="win-title">{{ title }}</div>
        <div v-if="subtitle" class="win-subtitle">{{ subtitle }}</div>
      </div>
    </div>

    <div v-if="$slots.actions" class="ds-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps<{
  title: string;
  subtitle?: string;
  showBack?: boolean;
}>();

const router = useRouter();

function onBack() {
  router.back();
}
</script>
