<template>
  <v-navigation-drawer
    :model-value="modelValue"
    location="right"
    border="left"
    permanent
    width="280"
    class="pos-nav-drawer"
    :rail="rail"
    :rail-width="80"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div
      style="
        border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        position: sticky;
        top: 0;
        z-index: 1;
        background: rgba(var(--v-theme-surface), 1);
      "
    >
      <div v-if="rail" class="sidebar-logo">
        <v-btn variant="tonal" icon size="small" @click="rail = false" class="rail-toggle-btn">
          <v-icon size="20">mdi-chevron-left</v-icon>
        </v-btn>

        <v-img :src="logo" lazy-src="../../assets/logo.png" alt="Logo" contain class="rail-logo" />
      </div>

      <div v-else class="sidebar-logo">
        <v-img
          :src="logo"
          lazy-src="../../assets/logo.png"
          alt="Logo"
          contain
          max-width="28"
          max-height="28"
        />

        <span class="text-subtitle-2 font-weight-medium">نقطة بلس</span>
        <v-spacer />

        <v-btn variant="text" icon size="small" @click="rail = !rail">
          <v-icon size="20">mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <v-list nav density="compact">
      <template v-for="entry in primaryNav" :key="entry.type === 'item' ? entry.to : entry.id">
        <v-list-item
          v-if="entry.type === 'item'"
          :to="entry.to"
          :prepend-icon="entry.icon"
          exact
          :active="isNavActive(entry)"
          :class="rail ? 'rail' : ''"
        >
          <v-list-item-title v-if="!rail">{{ entry.label }}</v-list-item-title>
        </v-list-item>

        <!-- else if its head and then make <v-list-subheader>Tonal Variant</v-list-subheader> -->
        <v-list-subheader v-else-if="entry.type === 'head' && !rail" class="text-caption">
          {{ entry.label }}
        </v-list-subheader>
      </template>
    </v-list>

    <v-list nav density="compact">
      <v-list-subheader class="text-caption" v-if="!rail"> ادارة النظام </v-list-subheader>
      <v-list-item
        v-for="item in footerNav"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :class="rail ? 'rail' : ''"
        exact
      >
        <v-list-item-title v-if="!rail">{{ item.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import type { NavEntry, FooterNavItem } from '@/composables/usePosNavigation';
import { ref } from 'vue';

const logo = new URL('../../assets/logo.png', import.meta.url).href;
const rail = ref(false);

defineProps<{
  modelValue: boolean;
  primaryNav: NavEntry[];
  footerNav: FooterNavItem[];
  isNavActive: (entry: NavEntry) => boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped lang="scss">
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-inline: 16px;
  height: 52px;
  position: relative;
}

// :deep(.v-list-item .v-list-item--active) {
//   border-radius: 8px !important;
// }

/* rail toggle button */
.rail-toggle-btn {
  position: absolute;
  inset: 0;
  z-index: 2;
  margin: auto;
  visibility: hidden;
  opacity: 0;
}

.rail-logo {
  margin: auto;
}

.pos-nav-drawer:hover .rail-logo {
  visibility: hidden;
  opacity: 0;
}

.pos-nav-drawer:hover .rail-toggle-btn {
  visibility: visible;
  opacity: 1;
}

:deep(.rail) {
  .v-list-item__spacer {
    display: none !important;
  }
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .v-list-item__content {
    justify-content: center;
    display: none !important;
  }

  .v-list-item__prepend {
    margin: 0 !important;
  }

  .v-list-item__title {
    display: none !important;
  }
}
</style>
