<template>
  <PageShell>
    <div class="d-flex flex-column align-center justify-center py-16">
      <v-icon size="96" color="error" class="mb-4">mdi-shield-lock-outline</v-icon>
      <div class="text-h2 font-weight-bold text-error mb-2">403</div>
      <div class="win-title mb-2">{{ t('system.forbiddenTitle') }}</div>
      <div class="win-subtitle mb-8">{{ t('system.forbiddenSubtitle') }}</div>
      <div class="d-flex ga-3">
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
  </PageShell>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import { PageShell } from '@/components/layout';
</script>
