/**
 * Composable for real-time inventory alerts via SSE.
 * Listens for inventory and sale events, shows notifications,
 * and refreshes active stores when relevant data changes.
 */
import { onMounted } from 'vue';
import { useEventStream, type DomainEvent, DomainEventTypes } from '@/composables/useEventStream';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useProductsStore } from '@/stores/productsStore';
import { useSalesStore } from '@/stores/salesStore';
import { notifyInfo, notifySuccess, notifyWarn } from '@/utils/notify';

const EventGroups = {
  saleCompleted: [DomainEventTypes.SALE_CREATED, DomainEventTypes.SALE_COMPLETED],
  lowStock: ['inventory:low_stock', DomainEventTypes.INVENTORY_LOW_STOCK],
  expiryWarning: ['inventory:expiry_warning', DomainEventTypes.INVENTORY_EXPIRY_WARNING],
  inventoryChange: [
    'inventory:movement',
    DomainEventTypes.INVENTORY_MOVEMENT,
    DomainEventTypes.INVENTORY_ADJUSTED,
    DomainEventTypes.INVENTORY_RECONCILED,
  ],
} as const;

type AlertCallbacks = {
  onLowStock?: (event: DomainEvent) => void;
  onSaleCompleted?: (event: DomainEvent) => void;
  onInventoryChange?: (event: DomainEvent) => void;
};

function readString(payload: Record<string, unknown>, key: string, fallback: string): string {
  const value = payload[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function refreshRelatedStores(): void {
  const productsStore = useProductsStore();
  const inventoryStore = useInventoryStore();

  if (productsStore.items.length > 0) {
    void productsStore.fetchProducts();
  }

  if (inventoryStore.dashboard) {
    void inventoryStore.fetchDashboard();
  }

  if (inventoryStore.expiryAlerts.length > 0) {
    void inventoryStore.fetchExpiryAlerts();
  }
}

export function useInventoryAlerts(options?: AlertCallbacks) {
  const inventoryStore = useInventoryStore();
  const productsStore = useProductsStore();
  const salesStore = useSalesStore();
  const { on, connect, connected, connectionState } = useEventStream();

  onMounted(() => {
    connect();
  });

  EventGroups.saleCompleted.forEach((eventType) => {
    on(eventType, (event) => {
      if (salesStore.items.length > 0) {
        void salesStore.fetchSales();
      }

      refreshRelatedStores();

      const payload = event.payload as Record<string, unknown>;
      const invoiceNumber = readString(payload, 'invoiceNumber', 'عملية بيع جديدة');
      notifySuccess(`تم تسجيل ${invoiceNumber}`, {
        dedupeKey: `sale-event-${invoiceNumber}`,
      });
      options?.onSaleCompleted?.(event);
    });
  });

  EventGroups.lowStock.forEach((eventType) => {
    on(eventType, (event) => {
      const payload = event.payload as Record<string, unknown>;
      const productName = readString(payload, 'productName', 'منتج');
      notifyWarn(`تنبيه مخزون منخفض: ${productName}`, {
        dedupeKey: `low-stock-${productName}`,
      });

      if (productsStore.items.length > 0 || inventoryStore.dashboard) {
        refreshRelatedStores();
      }

      options?.onLowStock?.(event);
    });
  });

  EventGroups.expiryWarning.forEach((eventType) => {
    on(eventType, (event) => {
      const payload = event.payload as Record<string, unknown>;
      const productName = readString(payload, 'productName', 'منتج');
      notifyInfo(`تنبيه صلاحية قريب: ${productName}`, {
        dedupeKey: `expiry-warning-${productName}`,
      });

      if (inventoryStore.expiryAlerts.length > 0) {
        void inventoryStore.fetchExpiryAlerts();
      }
    });
  });

  EventGroups.inventoryChange.forEach((eventType) => {
    on(eventType, (event) => {
      refreshRelatedStores();
      options?.onInventoryChange?.(event);
    });
  });

  return {
    connected,
    connectionState,
    EventGroups,
  };
}
