<template>
  <div class="d-flex fill-height align-center justify-center">
    <div class="text-center" style="max-width: 400px">
      <v-icon size="96" color="error" class="mb-4">mdi-shield-lock-outline</v-icon>
      <div class="text-h2 font-weight-bold text-error mb-2">403</div>
      <div class="text-h5 font-weight-bold mb-2">{{ t('system.forbiddenTitle') }}</div>
      <div class="text-body-1 text-medium-emphasis mb-8">
        {{ t('system.forbiddenSubtitle') }}
      </div>
      <div class="d-flex justify-center ga-3">
        <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-home" to="/">
          {{ t('system.goHome') }}
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          prepend-icon="mdi-arrow-right"
          @click="$router.back()"
        >
          {{ t('system.goBack') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
</script>
