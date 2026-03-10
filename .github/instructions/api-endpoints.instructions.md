---
applyTo: 'src/api/**/*.ts'
---

# API Layer Conventions

## Result Pattern

All API calls return `ApiResult<T>` — a discriminated union. Never throw from API functions.

```ts
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
```

Use `createSuccess()` and `createFailure()` builders from `@/api/contracts`.

## Endpoint Client Structure

One file per domain in `src/api/endpoints/`. Export a plain object with methods:

```ts
import { apiGet, apiPost, apiPut, apiDelete } from '../http';
import type { ApiResult, PagedResult } from '../contracts';
import type { Example, ExampleInput } from '../../types/domain';

export const exampleClient = {
  getAll: (params?: { search?: string }): Promise<ApiResult<PagedResult<Example>>> =>
    apiGet<PagedResult<Example>>('/examples', { params }),

  getById: (id: number): Promise<ApiResult<Example>> => apiGet<Example>(`/examples/${id}`),

  create: (data: ExampleInput): Promise<ApiResult<Example>> => apiPost<Example>('/examples', data),

  update: (id: number, data: Partial<ExampleInput>): Promise<ApiResult<Example>> =>
    apiPut<Example>(`/examples/${id}`, data),

  remove: (id: number): Promise<ApiResult<void>> => apiDelete<void>(`/examples/${id}`),
};
```

## Rules

- Define request/response interfaces in the endpoint file or `@/types/domain`
- Export every new client from `src/api/index.ts` (barrel file)
- Use `apiGet`, `apiPost`, `apiPut`, `apiDelete` helpers from `../http` — never call `http` directly
- Use `PagedResult<T>` for list endpoints that return `{ items, total }`
