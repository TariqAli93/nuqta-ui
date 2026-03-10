/**
 * Event Bridge — maps SSE domain events to Pinia store invalidation.
 *
 * This module acts as the glue between the real-time event stream
 * (useEventStream) and the application's Pinia stores + query cache.
 *
 * Call `initEventBridge()` once after authentication succeeds.
 */
import { onEvent, connectEventStream, disconnectEventStream } from '@/composables/useEventStream';
import { invalidateCacheByPrefix } from '@/composables/useQueryCache';

type StoreRefresher = () => void;

// Registry of store refreshers — populated lazily to avoid circular imports
const refreshers: Record<string, StoreRefresher[]> = {};

/**
 * Register a store refresh callback for a given event type.
 * Call this from Pinia stores or components that need to react to SSE events.
 */
export function onDomainEvent(eventType: string, refresher: StoreRefresher): () => void {
  if (!refreshers[eventType]) {
    refreshers[eventType] = [];
  }
  refreshers[eventType].push(refresher);

  return () => {
    const list = refreshers[eventType];
    if (list) {
      const idx = list.indexOf(refresher);
      if (idx >= 0) list.splice(idx, 1);
    }
  };
}

/**
 * Initialize the event bridge.
 * Connects to SSE and sets up default event → cache invalidation mappings.
 */
export function initEventBridge(): void {
  // Sale events → invalidate sales, products (stock changed), dashboard caches
  onEvent('sale:created', () => {
    invalidateCacheByPrefix('sales');
    invalidateCacheByPrefix('products');
    invalidateCacheByPrefix('dashboard');
    invalidateCacheByPrefix('inventory');
    refreshers['sale:created']?.forEach((fn) => fn());
  });

  onEvent('sale:cancelled', () => {
    invalidateCacheByPrefix('sales');
    invalidateCacheByPrefix('products');
    invalidateCacheByPrefix('dashboard');
    refreshers['sale:cancelled']?.forEach((fn) => fn());
  });

  // Product events → invalidate products cache
  onEvent('product:created', () => {
    invalidateCacheByPrefix('products');
    refreshers['product:created']?.forEach((fn) => fn());
  });

  onEvent('product:updated', () => {
    invalidateCacheByPrefix('products');
    refreshers['product:updated']?.forEach((fn) => fn());
  });

  onEvent('product:deleted', () => {
    invalidateCacheByPrefix('products');
    refreshers['product:deleted']?.forEach((fn) => fn());
  });

  // Inventory events → invalidate inventory + products caches
  onEvent('inventory:adjusted', () => {
    invalidateCacheByPrefix('inventory');
    invalidateCacheByPrefix('products');
    refreshers['inventory:adjusted']?.forEach((fn) => fn());
  });

  onEvent('inventory:reconciled', () => {
    invalidateCacheByPrefix('inventory');
    invalidateCacheByPrefix('products');
    refreshers['inventory:reconciled']?.forEach((fn) => fn());
  });

  // Settings events → invalidate settings cache
  onEvent('settings:changed', () => {
    invalidateCacheByPrefix('settings');
    refreshers['settings:changed']?.forEach((fn) => fn());
  });

  // Connect to the SSE stream
  connectEventStream();
}

/**
 * Tear down the event bridge (e.g., on logout).
 */
export function destroyEventBridge(): void {
  disconnectEventStream();
}
