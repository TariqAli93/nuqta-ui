<template>
  <slot v-if="!hasError" />
  <v-alert
    v-else
    type="error"
    variant="tonal"
    class="ma-4"
    closable
    @click:close="reset"
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

onErrorCaptured((err: Error) => {
  hasError.value = true;
  errorMessage.value = err.message || t('errors.unexpected');

  // Log for debugging
  // eslint-disable-next-line no-console
  console.error('[ErrorBoundary]', err);

  // Prevent error from propagating further
  return false;
});

function reset(): void {
  hasError.value = false;
  errorMessage.value = '';
}

defineExpose({ reset, hasError });
</script>
