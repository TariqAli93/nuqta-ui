<template>
  <div v-if="!hasError" :key="renderKey">
    <slot />
  </div>
  <v-alert
    v-else
    type="error"
    variant="tonal"
    class="ma-4"
  >
    <template #title>{{ t('errors.unexpected') }}</template>
    <template #text>
      <p class="mb-2">{{ errorMessage }}</p>
      <v-btn size="small" variant="outlined" color="error" @click="reset">
        {{ t('common.refresh') }}
      </v-btn>
    </template>
  </v-alert>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { t } from '@/i18n/t';

const hasError = ref(false);
const errorMessage = ref('');
const renderKey = ref(0);

onErrorCaptured((err: Error, _instance, info) => {
  hasError.value = true;
  errorMessage.value = err.message || t('errors.unexpected');

  // Log for debugging
  // eslint-disable-next-line no-console
  console.error('[ErrorBoundary]', { err, info });

  // Prevent error from propagating further
  return false;
});

function reset(): void {
  hasError.value = false;
  errorMessage.value = '';
  renderKey.value += 1;
}

defineExpose({ reset, hasError });
</script>
