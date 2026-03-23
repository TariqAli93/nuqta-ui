<template>
  <v-app-bar border="0" density="comfortable" flat class="flex align-center justify-between">
    <v-container class="flex align-center justify-between ga-3">
      <div class="flex align-center justify-between ga-3">
        <v-btn v-if="showBack" icon="mdi-arrow-right" variant="text" size="small" @click="onBack" />
        <div>
          <div class="win-title">{{ title }}</div>
          <div v-if="subtitle" class="win-subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <v-spacer />

      <div v-if="$slots.actions" class="ds-page-header__actions">
        <slot name="actions" />
      </div>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useRouter, type RouteLocationRaw } from 'vue-router';

/**
 * PageHeader navigation contract:
 *
 * - showBack: shows the back button
 * - backTo: deterministic route target (use for detail/form pages that have a known parent)
 * - backFallback: fallback route when history is empty (direct visit, refresh, deep link).
 *   Only used when backTo is NOT set and the page relies on history-based navigation.
 *
 * Priority: backTo > router.back() with backFallback safety net
 *
 * When adding a new page:
 * - Detail/form pages: always set backTo to the parent list/workspace route
 * - Pages where history-back is acceptable: set backFallback for direct-visit safety
 * - List/workspace pages: typically no back button needed
 */
const props = defineProps<{
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** Deterministic back destination. Takes priority over history-based navigation. */
  backTo?: RouteLocationRaw;
  /** Fallback route when using history-back and history may be empty (direct visit / refresh). */
  backFallback?: RouteLocationRaw;
}>();

const router = useRouter();

function onBack() {
  if (props.backTo) {
    void router.push(props.backTo);
    return;
  }

  // History-based navigation with fallback protection.
  // window.history.length <= 1 indicates no prior navigation (direct visit, new tab, refresh).
  if (props.backFallback && window.history.length <= 1) {
    void router.push(props.backFallback);
    return;
  }

  router.back();
}
</script>
