<template>
  <v-menu v-model="menuOpen" :close-on-content-click="false" :disabled="disabled || outerReadonly">
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="{ ...menuProps, ...$attrs }"
        :model-value="displayValue"
        :label="label"
        :variant="variant"
        :density="density"
        :hide-details="hideDetails"
        :rules="rules"
        :disabled="disabled"
        :clearable="clearable"
        :hint="hint"
        :error-messages="errorMessages"
        :required="required"
        readonly
        prepend-inner-icon="mdi-calendar"
        @click:clear="onClear"
      />
    </template>
    <v-date-picker
      :model-value="pickerValue"
      :min="min"
      :max="max"
      color="primary"
      hide-header
      @update:model-value="onDateSelected"
    />
  </v-menu>
</template>

<script setup lang="ts">
/**
 * Reusable date input component that wraps Vuetify's v-menu + v-date-picker.
 *
 * Model value is an ISO date string (YYYY-MM-DD) or null — fully compatible
 * with the format previously used by `v-text-field type="date"`.
 */
import { computed, ref } from 'vue';

defineOptions({ inheritAttrs: false });

interface Props {
  modelValue?: string | null;
  label?: string;
  variant?:
    | 'outlined'
    | 'plain'
    | 'underlined'
    | 'filled'
    | 'solo'
    | 'solo-inverted'
    | 'solo-filled';
  density?: 'default' | 'comfortable' | 'compact';
  hideDetails?: boolean | 'auto';
  clearable?: boolean;
  rules?: ((v: any) => boolean | string)[];
  disabled?: boolean;
  readonly?: boolean;
  min?: string;
  max?: string;
  hint?: string;
  errorMessages?: string | string[];
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: '',
  variant: 'outlined',
  density: 'comfortable',
  hideDetails: false,
  clearable: false,
  rules: () => [],
  disabled: false,
  readonly: false,
  min: undefined,
  max: undefined,
  hint: undefined,
  errorMessages: undefined,
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const menuOpen = ref(false);
const outerReadonly = computed(() => props.readonly);

// ---------- display helpers ----------

const _fmt = new Intl.DateTimeFormat('ar-IQ', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  numberingSystem: 'latn',
});

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const displayValue = computed(() => {
  if (!props.modelValue) return 'YYYY/MM/DD';
  const d = parseLocalDate(props.modelValue);
  if (Number.isNaN(d.getTime())) return '';
  return _fmt.format(d);
});

const pickerValue = computed(() => {
  if (!props.modelValue) return undefined;
  return parseLocalDate(props.modelValue);
});

// ---------- event handlers ----------

function onDateSelected(value: unknown): void {
  if (value instanceof Date) {
    emit('update:modelValue', toIsoString(value));
  }
  menuOpen.value = false;
}

function onClear(): void {
  emit('update:modelValue', null);
}
</script>
