<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="close">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>تعديل مخزون</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close(false)" />
      </v-card-title>
      <v-card-text>
        <v-sheet
          v-if="product"
          class="d-flex align-center ga-2 px-3 py-2 mb-3 text-info"
          color="transparent"
        >
          <v-icon size="18">mdi-information-outline</v-icon>
          <span>المنتج: {{ product.name }} | المخزون الحالي: {{ product.stock ?? 0 }}</span>
        </v-sheet>

        <v-row>
          <v-col cols="6">
            <v-select
              v-model="reason"
              :items="reasonItems"
              item-title="title"
              item-value="value"
              label="السبب"
              variant="outlined" density="comfortable"
            />
          </v-col>

          <v-col cols="6">
            <v-text-field
              v-model.number="quantityBase"
              label="الكمية (+ زيادة / - نقصان)"
              type="number"
              variant="outlined" density="comfortable"
            />
          </v-col>
        </v-row>

        <UnitSelector :units="units" v-model="selectedUnitId" class="my-2" />

        <v-textarea v-model="notes" label="ملاحظات" rows="2" variant="outlined" density="comfortable" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn class="win-ghost-btn" variant="text" @click="close(false)">إلغاء</v-btn>
        <v-btn class="win-btn" color="primary" variant="flat" :loading="loading" @click="submit">حفظ</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Product, ProductUnit } from '@/types/domain';
import UnitSelector from '@/components/shared/UnitSelector.vue';

const props = defineProps<{
  modelValue: boolean;
  product: Product | null;
  units: ProductUnit[];
  loading: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [
    payload: {
      productId: number;
      quantityBase: number;
      reason: 'manual' | 'damage' | 'opening';
      unitName?: string;
      unitFactor?: number;
      batchId?: number;
      notes?: string;
    },
  ];
}>();

const reason = ref<'manual' | 'damage' | 'opening'>('manual');
const quantityBase = ref(0);
const notes = ref('');
const selectedUnitId = ref<number | undefined>(undefined);

const reasonItems = [
  { title: 'تعديل يدوي', value: 'manual' },
  { title: 'تالف', value: 'damage' },
  { title: 'رصيد افتتاحي', value: 'opening' },
];

/** Resolve the selected unit for name + factor. */
const resolvedUnit = computed(() => {
  if (!selectedUnitId.value) return null;
  return props.units.find((u) => u.id === selectedUnitId.value) ?? null;
});

// Reset form fields when the drawer opens
watch(
  () => props.modelValue,
  (opened) => {
    if (!opened) return;
    reason.value = 'manual';
    quantityBase.value = 0;
    notes.value = '';
    selectedUnitId.value = undefined;
  }
);

function close(value: boolean): void {
  emit('update:modelValue', value);
}

function submit(): void {
  if (!props.product?.id) return;
  if (!Number.isFinite(quantityBase.value) || quantityBase.value === 0) return;

  emit('submit', {
    productId: props.product.id,
    quantityBase: quantityBase.value,
    reason: reason.value,
    unitName: resolvedUnit.value?.unitName ?? props.product.unit ?? undefined,
    unitFactor: resolvedUnit.value?.factorToBase ?? undefined,
    notes: notes.value || undefined,
  });
}
</script>
