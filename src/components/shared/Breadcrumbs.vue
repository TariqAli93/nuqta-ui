<template>
  <v-breadcrumbs :items="breadcrumbItems" class="px-0 py-2">
    <template #divider>
      <v-icon icon="mdi-chevron-left" size="small" />
    </template>
  </v-breadcrumbs>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { t } from '@/i18n/t';

const route = useRoute();

const breadcrumbItems = computed(() => {
  const crumbs = route.meta?.breadcrumb as Array<{ title: string; to?: string }> | undefined;
  if (!crumbs || crumbs.length === 0) return [];

  return crumbs.map((crumb, index) => ({
    title: t(crumb.title) || crumb.title,
    to: index < crumbs.length - 1 ? crumb.to : undefined,
    disabled: index === crumbs.length - 1,
  }));
});
</script>
