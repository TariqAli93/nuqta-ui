/**
 * Composable providing Vuetify-compatible validation rules
 * with Arabic error messages.
 */
import { ref, type Ref } from 'vue';
import { t } from '@/i18n/t';

type ValidationRule = (value: unknown) => true | string;
type ValidationResult = boolean | { valid: boolean };

interface ValidatableForm {
  validate: () => Promise<ValidationResult> | ValidationResult;
  reset?: () => void;
  resetValidation?: () => void;
}

function interpolate(key: string, vars: Record<string, string | number>): string {
  let text = t(key);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== '';
}

export function useFormValidation(formRef?: Ref<ValidatableForm | undefined>) {
  const isValid = ref(true);

  const rules = {
    required: ((v: unknown) =>
      hasValue(v) || t('validation.required')) as ValidationRule,

    minLength: (min: number): ValidationRule =>
      (v: unknown) =>
        (!hasValue(v) || (typeof v === 'string' && v.length >= min)) ||
        interpolate('validation.minLength', { min }),

    maxLength: (max: number): ValidationRule =>
      (v: unknown) =>
        (!hasValue(v) || (typeof v === 'string' && v.length <= max)) ||
        interpolate('validation.maxLength', { max }),

    numeric: ((v: unknown) =>
      !hasValue(v) || !isNaN(Number(v)) ||
      t('validation.invalid')) as ValidationRule,

    minValue: (min: number): ValidationRule =>
      (v: unknown) =>
        !hasValue(v) || Number(v) >= min ||
        interpolate('validation.minValue', { min }),

    maxValue: (max: number): ValidationRule =>
      (v: unknown) =>
        !hasValue(v) || Number(v) <= max ||
        interpolate('validation.maxValue', { max }),

    phone: ((v: unknown) =>
      !hasValue(v) ||
      /^[\d\s+\-()]{7,20}$/.test(String(v)) ||
      t('validation.invalidPhone')) as ValidationRule,

    email: ((v: unknown) =>
      !hasValue(v) ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ||
      t('validation.invalid')) as ValidationRule,
  };

  async function validate(target = formRef?.value): Promise<boolean> {
    if (!target) {
      isValid.value = true;
      return true;
    }

    const result = await target.validate();
    isValid.value = typeof result === 'boolean' ? result : result.valid;
    return isValid.value;
  }

  function reset(target = formRef?.value): void {
    target?.resetValidation?.();
    target?.reset?.();
    isValid.value = true;
  }

  return { rules, validate, isValid, reset };
}
