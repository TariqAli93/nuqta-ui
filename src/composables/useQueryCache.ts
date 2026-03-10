/**
 * TTL-based API response cache with stale-while-revalidate support.
 *
 * Usage:
 *   const { data, loading, error, refresh, invalidate } = useQueryCache(
 *     'products-list',
 *     () => productsClient.getAll(params),
 *     { ttl: 60_000, staleWhileRevalidate: true }
 *   );
 */
import { ref, onUnmounted, type Ref } from 'vue';
import type { ApiResult } from '@/api/contracts';

export interface QueryCacheOptions {
  /** Time-to-live in ms before cache entry is considered stale. Default: 60_000 (1 min). */
  ttl?: number;
  /** If true, return stale data immediately while refetching in background. Default: true. */
  staleWhileRevalidate?: boolean;
  /** If true, fetch immediately on creation. Default: true. */
  immediate?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

// Global cache store shared across all composable instances
const globalCache = new Map<string, CacheEntry<unknown>>();
// Track active invalidation listeners per key
const invalidationListeners = new Map<string, Set<() => void>>();

/**
 * Invalidate a cache entry externally (e.g., from SSE event bridge).
 * All active composable instances using this key will refetch.
 */
export function invalidateCache(key: string): void {
  globalCache.delete(key);
  const listeners = invalidationListeners.get(key);
  if (listeners) {
    listeners.forEach((cb) => cb());
  }
}

/** Invalidate all cache entries matching a prefix. */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of globalCache.keys()) {
    if (key.startsWith(prefix)) {
      invalidateCache(key);
    }
  }
}

/** Clear the entire cache. */
export function clearCache(): void {
  globalCache.clear();
}

export function useQueryCache<T>(
  key: string,
  fetcher: () => Promise<ApiResult<T>>,
  options: QueryCacheOptions = {},
) {
  const { ttl = 60_000, staleWhileRevalidate = true, immediate = true } = options;

  const data: Ref<T | null> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function isFresh(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp < ttl;
  }

  async function fetchData(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const result = await fetcher();
      if (result.ok) {
        data.value = result.data;
        globalCache.set(key, {
          data: result.data,
          timestamp: Date.now(),
        });
      } else {
        error.value = result.error.message;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  async function loadFromCacheOrFetch(): Promise<void> {
    const cached = globalCache.get(key) as CacheEntry<T> | undefined;

    if (cached) {
      // Always serve cached data immediately
      data.value = cached.data;

      if (isFresh(cached)) {
        // Cache is fresh — no fetch needed
        return;
      }

      if (staleWhileRevalidate) {
        // Stale but usable — refetch in background (no loading indicator)
        fetchData();
        return;
      }
    }

    // No cache or staleWhileRevalidate is off — full fetch with loading state
    await fetchData();
  }

  /** Force refetch, ignoring cache. */
  async function refresh(): Promise<void> {
    globalCache.delete(key);
    await fetchData();
  }

  /** Remove cache entry and clear local data. */
  function invalidate(): void {
    invalidateCache(key);
  }

  // Register for external invalidation
  if (!invalidationListeners.has(key)) {
    invalidationListeners.set(key, new Set());
  }
  const listener = () => {
    loadFromCacheOrFetch();
  };
  invalidationListeners.get(key)!.add(listener);

  onUnmounted(() => {
    invalidationListeners.get(key)?.delete(listener);
    if (invalidationListeners.get(key)?.size === 0) {
      invalidationListeners.delete(key);
    }
  });

  if (immediate) {
    loadFromCacheOrFetch();
  }

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}
