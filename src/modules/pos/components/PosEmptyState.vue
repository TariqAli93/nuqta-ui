<template>
  <v-sheet
    color="transparent"
    rounded="0"
    min-height="300"
    class="d-flex flex-column align-center justify-center"
  >
    <v-icon size="56" color="grey-lighten-2">mdi-package-variant-closed</v-icon>
    <div class="text-subtitle-1 text-medium-emphasis mt-4">{{ t('pos.noProducts') }}</div>
    <div class="text-body-2 text-medium-emphasis mt-2 text-center">
      {{ t('pos.noProductsHint') }}
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
</script>
