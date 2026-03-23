<template>
  <PageShell>
    <div class="d-flex flex-column align-center justify-center py-16">
      <v-icon size="96" color="warning" class="mb-4">mdi-file-search-outline</v-icon>
      <div class="win-title mb-2">{{ t('system.notFoundTitle') }}</div>
      <div class="win-subtitle mb-8">{{ t('system.notFoundSubtitle') }}</div>
      <div class="d-flex ga-3">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-home" to="/">
          {{ t('system.goHome') }}
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-arrow-right" @click="$router.back()">
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
