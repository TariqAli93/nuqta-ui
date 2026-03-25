<template>
  <div class="d-flex align-center mb-6 px-1">
    <CategoryStrip
      :categories="categories"
      :selected-id="selectedCategory"
      class="grow overflow-hidden mr-4"
      @select="emit('select-category', $event)"
    />

    <v-sheet class="flex items-center" color="transparent" elevation="0">
      <v-btn icon size="small" variant="text" @click="emit('show-shortcuts')">
        <v-icon size="20">mdi-keyboard-outline</v-icon>
      </v-btn>
      <v-divider vertical class="mx-1"></v-divider>
      <v-btn-toggle
        :model-value="layout"
        density="compact"
        variant="text"
        class="bg-transparent toggle-group-borderless"
        @update:model-value="(v: any) => v && emit('update:layout', v)"
      >
        <v-btn value="grid" icon>
          <v-icon>mdi-view-grid</v-icon>
        </v-btn>
        <v-btn value="list" icon>
          <v-icon>mdi-view-list-outline</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-sheet>
  </div>
</template>

<style scoped>
.toggle-group-borderless {
  border: none !important;
}
.toggle-group-borderless :deep(.v-btn) {
  border: none !important;
}
.toggle-group-borderless :deep(.v-btn--active) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>

<script setup lang="ts">
import CategoryStrip from '@/components/pos/CategoryStrip.vue';

defineProps<{
  categories: { id: number | null; name: string }[];
  selectedCategory: number | null;
  layout: string;
}>();

const emit = defineEmits<{
  'select-category': [id: number | null];
  'show-shortcuts': [];
  'update:layout': [value: string];
}>();
</script>
