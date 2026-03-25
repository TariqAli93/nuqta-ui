<template>
  <div class="category-strip-container">
    <v-slide-group
      :model-value="selectedId"
      show-arrows
      @update:model-value="$emit('select', $event)"
    >
      <v-slide-group-item
        v-for="category in categories"
        :key="category.id ?? 'all'"
        :value="category.id"
        v-slot="{ isSelected, toggle }"
      >
        <v-btn
          :color="isSelected ? 'primary' : undefined"
          :variant="isSelected ? 'flat' : 'text'"
          rounded="pill"
          size="large"
          class="text-none font-weight-medium ma-1 px-6 transition-all category-pill"
          :class="[
            !isSelected ? 'text-medium-emphasis bg-surface border' : 'elevation-2 border-primary',
          ]"
          @click="toggle"
        >
          {{ category.name }}
        </v-btn>
      </v-slide-group-item>
    </v-slide-group>
  </div>
</template>

<style scoped>
.category-pill {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  letter-spacing: 0.2px;
}
.category-pill.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
}
.transition-all {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.category-strip-container :deep(.v-slide-group__prev),
.category-strip-container :deep(.v-slide-group__next) {
  min-width: 32px;
  flex: 0 1 32px;
}
</style>

<script setup lang="ts">
interface CategoryItem {
  id: number | null;
  name: string;
}

interface Props {
  categories: CategoryItem[];
  selectedId?: number | null;
}

withDefaults(defineProps<Props>(), {
  selectedId: null,
});

defineEmits<{
  select: [id: number | null];
}>();
</script>
