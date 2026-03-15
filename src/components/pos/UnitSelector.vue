<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-chip
        v-bind="menuProps"
        size="x-small"
        variant="outlined"
        color="primary"
        class="cursor-pointer"
        append-icon="mdi-chevron-down"
      >
        {{ current }}
      </v-chip>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="unit in units"
        :key="unit.unitName"
        :active="unit.unitName === current"
        @click="emit('select', unit)"
      >
        <template #prepend>
          <v-icon v-if="unit.unitName === current" size="16" color="primary" class="ml-1">
            mdi-check-circle
          </v-icon>
        </template>
        <v-list-item-title class="text-body-2">
          {{ unit.unitName }}
          <span v-if="unit.sellingPrice != null" class="text-caption text-medium-emphasis mr-2">
            ({{ formatPrice(unit.sellingPrice) }})
          </span>
        </v-list-item-title>
        <v-list-item-subtitle v-if="(unit.factorToBase ?? 1) > 1" class="text-caption">
          = {{ unit.factorToBase }} {{ baseUnitLabel }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-menu>
  <span class="mr-1">·</span>
</template>

<script setup lang="ts">
import type { ProductUnitOption } from '@/types/pos';
import { formatPrice } from '@/utils/format';
import { computed } from 'vue';

const props = defineProps<{
  current: string;
  units: ProductUnitOption[];
}>();

const emit = defineEmits<{
  select: [unit: ProductUnitOption];
}>();

// Derive the base unit label from the unit with factor=1
const baseUnitLabel = computed(() => {
  const base = props.units.find((u) => (u.factorToBase ?? 1) === 1);
  return base?.unitName ?? '';
});
</script>
