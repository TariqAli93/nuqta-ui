---
applyTo: 'src/stores/**/*.ts'
---

# Pinia Store Conventions

- Use Composition API style: `defineStore('name', () => { ... })`
- Use `shallowRef()` for large arrays/objects replaced wholesale (e.g., item lists)
- Use `ref()` for scalar state and small objects
- Use `computed()` for derived state
- Every async operation must track `loading` and `error` state
- Return all public state, computed, and functions explicitly

## Store Template

```ts
import { defineStore } from 'pinia';
import { ref, shallowRef, computed } from 'vue';
import { exampleClient } from '@/api';
import type { Example } from '@/types/domain';

export const useExampleStore = defineStore('example', () => {
  const items = shallowRef<Example[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchItems(params?: { search?: string; limit?: number }) {
    loading.value = true;
    error.value = null;

    const result = await exampleClient.getAll(params);

    if (result.ok) {
      items.value = result.data.items;
      total.value = result.data.total;
    } else {
      error.value = result.error.message;
    }

    loading.value = false;
    return result;
  }

  async function createItem(payload: ExampleInput) {
    loading.value = true;
    error.value = null;
    const result = await exampleClient.create(payload);
    if (!result.ok) {
      error.value = result.error.message;
    }
    loading.value = false;
    return result;
  }

  return { items, total, loading, error, fetchItems, createItem };
});
```

## Key Rules

- Always reset `error.value = null` before async calls
- Always set `loading.value = false` after the operation (success or failure)
- Always return the `ApiResult` from async actions so callers can react
- Check `result.ok` — never use try/catch for API calls (the API layer handles that)
