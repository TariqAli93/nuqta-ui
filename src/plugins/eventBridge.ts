/**
 * Event bridge that maps SSE domain events to cache invalidation hooks.
 */
import { connectEventStream, disconnectEventStream, onEvent } from '@/composables/useEventStream';
import { invalidateCacheByPrefix } from '@/composables/useQueryCache';

type StoreRefresher = () => void;

const refreshers: Record<string, StoreRefresher[]> = {};
let initialized = false;
let cleanupHandlers: Array<() => void> = [];

function registerAliases(eventTypes: string[], handler: () => void): void {
  eventTypes.forEach((eventType) => {
    cleanupHandlers.push(onEvent(eventType, handler));
  });
}

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

export function initEventBridge(): void {
  if (initialized) return;
  initialized = true;

  registerAliases(['sale:created', 'sale.completed'], () => {
    invalidateCacheByPrefix('sales');
    invalidateCacheByPrefix('products');
    invalidateCacheByPrefix('dashboard');
    invalidateCacheByPrefix('inventory');
    refreshers['sale:created']?.forEach((fn) => fn());
  });

  registerAliases(['sale:cancelled', 'sale.cancelled'], () => {
    invalidateCacheByPrefix('sales');
    invalidateCacheByPrefix('products');
    invalidateCacheByPrefix('dashboard');
    refreshers['sale:cancelled']?.forEach((fn) => fn());
  });

  registerAliases(['product:created', 'product.created'], () => {
    invalidateCacheByPrefix('products');
    refreshers['product:created']?.forEach((fn) => fn());
  });

  registerAliases(['product:updated', 'product.updated'], () => {
    invalidateCacheByPrefix('products');
    refreshers['product:updated']?.forEach((fn) => fn());
  });

  registerAliases(['product:deleted', 'product.deleted'], () => {
    invalidateCacheByPrefix('products');
    refreshers['product:deleted']?.forEach((fn) => fn());
  });

  registerAliases(
    ['inventory:adjusted', 'inventory:movement', 'inventory.movement', 'inventory.low_stock'],
    () => {
      invalidateCacheByPrefix('inventory');
      invalidateCacheByPrefix('products');
      refreshers['inventory:adjusted']?.forEach((fn) => fn());
    }
  );

  registerAliases(['inventory:reconciled', 'inventory:expiry_warning', 'inventory.expiry_warning'], () => {
    invalidateCacheByPrefix('inventory');
    invalidateCacheByPrefix('products');
    refreshers['inventory:reconciled']?.forEach((fn) => fn());
  });

  registerAliases(['settings:changed', 'settings.changed'], () => {
    invalidateCacheByPrefix('settings');
    refreshers['settings:changed']?.forEach((fn) => fn());
  });

  connectEventStream();
}

export function destroyEventBridge(): void {
  cleanupHandlers.forEach((cleanup) => cleanup());
  cleanupHandlers = [];
  initialized = false;
  disconnectEventStream();
}
