<!--
  FilterBar — standardized filter/search container for list pages.
  Renders as a flat bordered v-card matching the canonical filter toolbar pattern.
  Place search fields, selects, and date inputs directly in the default slot.
-->
<template>
  <v-card elevation="0" variant="flat" class="border" rounded="lg">
    <v-card-text class="d-flex align-center ga-3 flex-wrap py-3">
      <slot />
    </v-card-text>
  </v-card>
</template>
