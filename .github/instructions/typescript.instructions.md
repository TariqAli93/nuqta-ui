---
applyTo: '**/*.ts'
---

# TypeScript Conventions

## Types & Naming

- Use `interface` for domain objects and request/response shapes
- Use `type` for unions, intersections, and utility types
- PascalCase for types, interfaces, and components
- camelCase for functions, variables, and store methods
- Prefix unused parameters with `_` (enforced by ESLint)

```ts
// ✅ Interface for domain objects
export interface Customer {
  id?: number;
  name: string;
  phone?: string | null;
}

// ✅ Type for literal unions
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'credit';
```

## Import Rules

- Use `@/` path alias for all imports — no relative `../../` paths
- Import API clients from `@/api` (barrel export) — never from `@/api/endpoints/...`
- Use `import type { X }` for type-only imports

```ts
// ✅ Correct
import { useAuthStore } from '@/stores/authStore';
import { productsClient } from '@/api';
import type { Product } from '@/types/domain';
import { t } from '@/i18n/t';

// ❌ Wrong — relative paths
import { useAuthStore } from '../../stores/authStore';
// ❌ Wrong — deep import
import { productsClient } from '@/api/endpoints/products';
```

## Strict Mode

TypeScript strict mode is enabled. Always provide explicit types for function parameters and return types when they're non-trivial. Let inference handle simple cases.
