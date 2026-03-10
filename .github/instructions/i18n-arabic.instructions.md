---
description: 'Use when adding user-facing text, error messages, labels, or any string displayed in the UI. Covers Arabic i18n and error mapping.'
applyTo: 'src/i18n/**'
---

# i18n & Arabic-First Conventions

This is an Arabic-first application. All user-facing text must be in Arabic.

## Translation Keys

- Add all UI strings to `src/i18n/ar.ts` as dot-notation keys
- Access translations via `t('section.key')` from `@/i18n/t`
- Group keys by feature: `auth.`, `products.`, `sales.`, `errors.`, `pos.`, etc.

```ts
// In ar.ts
export const ar: Record<string, string> = {
  'products.title': 'المنتجات',
  'products.addNew': 'إضافة منتج جديد',
  'errors.noPermission': 'لا توجد صلاحية',
};

// In components
import { t } from '@/i18n/t';
const label = t('products.title');
```

## Error Mapping

Use `mapErrorToArabic()` from `@/i18n/t` to convert API/system errors to user-friendly Arabic messages. This function auto-detects error types (permission, validation, load failure) via pattern matching.

```ts
import { mapErrorToArabic } from '@/i18n/t';

catch (err) {
  errorMessage.value = mapErrorToArabic(err);
}
```

## Rules

- Never hardcode Arabic strings in components — always use `t()` keys
- Never display raw English error messages to users
- When adding a new feature, add all its translation keys to `ar.ts` first
