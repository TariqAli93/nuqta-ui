<!--
  FilterBar — standardized filter/search container for list pages.
  Renders as a flat v-card with ds-filter-bar styling.
  Place search fields, selects, and date inputs directly in the default slot.
-->
<template>
  <v-card flat class="ds-filter-bar">
    <slot />
  </v-card>
</template>
