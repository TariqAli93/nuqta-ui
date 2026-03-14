import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STALE_MS = 5 * 60 * 1000;

/**
 * Shape returned by every `settingsApi.<group>.get()` / `.update()` call.
 * Adjust if your actual API wrapper uses a different envelope.
 */
interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: { message: string };
}

interface SettingsEndpoint<T> {
  get: () => Promise<ApiResult<T>>;
  update: (payload: Partial<T>) => Promise<ApiResult<T>>;
}

/**
 * Factory that produces a fully-typed Pinia settings store.
 *
 * Usage:
 * ```ts
 * export const usePosSettingsStore = createSettingsStore<PosSettings>(
 *   'posSettings',
 *   () => settingsApi.pos,
 * );
 * ```
 *
 * The `endpoint` parameter is a getter (lazy) so the `settingsApi` module
 * doesn't have to be resolved at import time — avoids circular-dep issues.
 */
export function createSettingsStore<T>(
  id: string,
  endpoint: () => SettingsEndpoint<T>,
) {
  return defineStore(id, () => {
    const data = ref<T | null>(null) as ReturnType<typeof ref<T | null>>;
    const loading = ref(false);
    const error = ref<string | null>(null);
    const lastFetched = ref<Date | null>(null);

    const isLoaded = computed(() => data.value !== null);
    const isStale = computed(() => {
      if (!lastFetched.value) return true;
      return Date.now() - lastFetched.value.getTime() > STALE_MS;
    });

    async function fetch(force = false): Promise<void> {
      if (isLoaded.value && !isStale.value && !force) return;

      loading.value = true;
      error.value = null;
      try {
        const result = await endpoint().get();
        if (result.ok && result.data !== undefined) {
          data.value = result.data;
          lastFetched.value = new Date();
        } else {
          error.value = result.error?.message ?? 'Unknown error';
        }
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Unknown error';
      } finally {
        loading.value = false;
      }
    }

    async function update(payload: Partial<T>): Promise<void> {
      loading.value = true;
      error.value = null;
      try {
        const result = await endpoint().update(payload);
        if (result.ok && result.data !== undefined) {
          data.value = result.data;
        } else {
          error.value = result.error?.message ?? 'Unknown error';
          throw new Error(error.value);
        }
      } catch (e) {
        if (!error.value) {
          error.value = e instanceof Error ? e.message : 'Unknown error';
        }
        throw e;
      } finally {
        loading.value = false;
      }
    }

    function reset(): void {
      data.value = null;
      loading.value = false;
      error.value = null;
      lastFetched.value = null;
    }

    return { data, loading, error, isLoaded, isStale, fetch, update, reset };
  });
}
