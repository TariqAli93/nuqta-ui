<template>
  <v-chip
    :color="chipColor"
    variant="tonal"
    size="small"
    class="mr-2"
  >
    <v-icon start size="12">{{ chipIcon }}</v-icon>
    {{ chipLabel }}
    <template v-if="state === 'syncing' && queueSize > 0">
      ({{ queueSize }})
    </template>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConnectionStatus, type ConnectionState } from '@/composables/useConnectionStatus';
import { useOfflineQueue } from '@/composables/useOfflineQueue';
import { t } from '@/i18n/t';

const { state } = useConnectionStatus();
const { queueSize } = useOfflineQueue();

const chipColor = computed(() => {
  const colors: Record<ConnectionState, string> = {
    online: 'success',
    offline: 'error',
    syncing: 'warning',
    degraded: 'warning',
  };
  return colors[state.value];
});

const chipIcon = computed(() => {
  const icons: Record<ConnectionState, string> = {
    online: 'mdi-check-circle',
    offline: 'mdi-close-circle',
    syncing: 'mdi-sync',
    degraded: 'mdi-alert-circle',
  };
  return icons[state.value];
});

const chipLabel = computed(() => {
  const labels: Record<ConnectionState, string> = {
    online: t('pos.online'),
    offline: t('pos.offline'),
    syncing: t('pos.syncing'),
    degraded: t('pos.degraded'),
  };
  return labels[state.value];
});
</script>
