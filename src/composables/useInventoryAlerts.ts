/**
 * Composable for real-time inventory alerts via SSE.
 * Listens for inventory and sale events and shows toast notifications.
 */
import { onMounted } from 'vue';
import { useEventStream } from '@/composables/useEventStream';
import type { DomainEvent } from '@/composables/useEventStream';
import { t } from '@/i18n/t';

/** SSE event types emitted by the backend */
export const EventTypes = {
  SALE_CREATED: 'sale:created',
  SALE_CANCELLED: 'sale:cancelled',
  SALE_REFUNDED: 'sale:refunded',
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  INVENTORY_ADJUSTED: 'inventory:adjusted',
  INVENTORY_RECONCILED: 'inventory:reconciled',
} as const;

export function useInventoryAlerts(options?: {
  onLowStock?: (event: DomainEvent) => void;
  onSaleCreated?: (event: DomainEvent) => void;
  onInventoryChange?: (event: DomainEvent) => void;
}) {
  const { on, connect, connected } = useEventStream();

  onMounted(() => {
    connect();
  });

  // Sale events
  on(EventTypes.SALE_CREATED, (event) => {
    options?.onSaleCreated?.(event);
  });

  // Inventory events
  on(EventTypes.INVENTORY_ADJUSTED, (event) => {
    options?.onInventoryChange?.(event);
  });

  on(EventTypes.INVENTORY_RECONCILED, (event) => {
    options?.onInventoryChange?.(event);
  });

  return {
    connected,
    EventTypes,
  };
}
