---
applyTo: 'src/__tests__/**/*.ts'
---

# Testing Conventions (Vitest)

## Store Tests

- Create a fresh Pinia per test with `setActivePinia(createPinia())`
- Clear `localStorage` in `beforeEach` and `afterEach`
- Restore mocks with `vi.restoreAllMocks()` in `afterEach`
- Mock API clients — never make real HTTP calls

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useExampleStore } from '@/stores/exampleStore';
import { exampleClient } from '@/api';
import { createApiSuccess, createApiFailure } from './factories';

vi.mock('@/api');

describe('exampleStore', () => {
  let store: ReturnType<typeof useExampleStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useExampleStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('fetches items on success', async () => {
    const mockData = { items: [{ id: 1, name: 'Test' }], total: 1 };
    vi.mocked(exampleClient.getAll).mockResolvedValue(createApiSuccess(mockData));

    await store.fetchItems();

    expect(store.items).toEqual(mockData.items);
    expect(store.total).toBe(1);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });
});
```

## Test Data Factories

Use factory functions from `src/__tests__/factories.ts` to create mock data. Add new factories there when introducing new domain types.

```ts
export const createApiSuccess = <T>(data: T): ApiResult<T> => ({ ok: true, data });
export const createApiFailure = (message = 'Error'): ApiResult<never> => ({
  ok: false,
  error: { code: 'ERROR', message },
});
```
