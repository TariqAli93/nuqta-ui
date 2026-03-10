---
applyTo: '**/*.vue'
---

# Vue Component Conventions

- Always use `<script setup lang="ts">` — no Options API
- Order sections: `<script setup>` → `<template>` → `<style scoped>` (if needed)
- Prefer Tailwind CSS utilities over scoped styles
- Use Vuetify components (`v-btn`, `v-card`, `v-text-field`, etc.) for UI elements

## Script Setup Structure

1. Imports (Vue, router, stores, composables, types)
2. Props / emits definitions
3. Store and composable usage
4. Reactive state (`ref`, `computed`)
5. Functions and handlers
6. Watchers and lifecycle hooks

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProductsStore } from '@/stores/productsStore';
import type { Product } from '@/types/domain';

const router = useRouter();
const store = useProductsStore();

const search = ref('');
const loading = ref(false);

async function handleSubmit() {
  loading.value = true;
  const result = await store.createProduct(payload);
  if (result.ok) router.push('/products');
  loading.value = false;
}
</script>
```

## Lazy-Loaded Route Components

Use arrow-function dynamic imports for route-level views:

```ts
const ProductsView = () => import('@/modules/products/ProductsView.vue');
```
