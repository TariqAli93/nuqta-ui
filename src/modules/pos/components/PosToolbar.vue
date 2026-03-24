<template>
  <div class="d-flex align-center mb-5">
    <CategoryStrip
      :categories="categories"
      :selected-id="selectedCategory"
      class="grow"
      @select="emit('select-category', $event)"
    />

    <v-btn icon size="small" variant="text" class="mr-2" @click="emit('show-shortcuts')">
      <v-icon>mdi-keyboard-outline</v-icon>
    </v-btn>

    <v-btn-toggle
      :model-value="layout"
      density="default"
      class="mr-2 gap-2"
      @update:model-value="(v: any) => v && emit('update:layout', v)"
    >
      <v-btn value="grid" icon size="small" variant="text">
        <v-icon>mdi-view-grid</v-icon>
      </v-btn>
      <v-btn value="list" icon size="small" variant="text">
        <v-icon>mdi-view-list</v-icon>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

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
