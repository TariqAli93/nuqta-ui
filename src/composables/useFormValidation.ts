/**
 * Composable providing Vuetify-compatible validation rules
 * with Arabic error messages.
 */
import { t } from '@/i18n/t';

type ValidationRule = (value: unknown) => true | string;

function interpolate(key: string, vars: Record<string, string | number>): string {
  let text = t(key);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}

export function useFormValidation() {
  const rules = {
    required: ((v: unknown) =>
      (v !== null && v !== undefined && v !== '') || t('validation.required')) as ValidationRule,

    minLength: (min: number): ValidationRule =>
      (v: unknown) =>
        (typeof v === 'string' && v.length >= min) ||
        interpolate('validation.minLength', { min }),

    maxLength: (max: number): ValidationRule =>
      (v: unknown) =>
        (typeof v === 'string' && v.length <= max) ||
        interpolate('validation.maxLength', { max }),

    numeric: ((v: unknown) =>
      v === '' || v === null || v === undefined || !isNaN(Number(v)) ||
      t('validation.invalid')) as ValidationRule,

    minValue: (min: number): ValidationRule =>
      (v: unknown) =>
        v === '' || v === null || v === undefined || Number(v) >= min ||
        interpolate('validation.minValue', { min }),

    maxValue: (max: number): ValidationRule =>
      (v: unknown) =>
        v === '' || v === null || v === undefined || Number(v) <= max ||
        interpolate('validation.maxValue', { max }),

    phone: ((v: unknown) =>
      !v ||
      /^[\d\s+\-()]{7,20}$/.test(String(v)) ||
      t('validation.invalidPhone')) as ValidationRule,

    email: ((v: unknown) =>
      !v ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ||
      t('validation.invalid')) as ValidationRule,
  };

  return { rules };
}
