/**
 * SSE (Server-Sent Events) client composable with auto-reconnect.
 *
 * Connects to the backend's /events/stream endpoint and dispatches
 * domain events to registered handlers.
 */
import { onUnmounted, ref } from 'vue';
import { getAccessToken } from '@/api/http';

export const DomainEventTypes = {
  SALE_CREATED: 'sale:created',
  SALE_CANCELLED: 'sale:cancelled',
  SALE_REFUNDED: 'sale:refunded',
  SALE_COMPLETED: 'sale.completed',
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  INVENTORY_LOW_STOCK: 'inventory.low_stock',
  INVENTORY_EXPIRY_WARNING: 'inventory.expiry_warning',
  INVENTORY_MOVEMENT: 'inventory.movement',
  INVENTORY_ADJUSTED: 'inventory:adjusted',
  INVENTORY_RECONCILED: 'inventory:reconciled',
  SETTINGS_CHANGED: 'settings:changed',
} as const;

export type DomainEventType = (typeof DomainEventTypes)[keyof typeof DomainEventTypes];

export interface DomainEvent<TPayload = Record<string, unknown>> {
  type: string;
  payload: TPayload;
  timestamp: string;
}

type EventHandler = (event: DomainEvent) => void;

function resolveEventBaseUrl(): string {
  const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');

  if (!import.meta.env.DEV) {
    return rawBaseUrl;
  }

  try {
    const url = new URL(rawBaseUrl, window.location.origin);
    const sameHostDifferentPort =
      url.hostname === window.location.hostname && url.port !== window.location.port;

    if (sameHostDifferentPort) {
      return url.pathname.replace(/\/$/, '');
    }
  } catch {
    return rawBaseUrl;
  }

  return rawBaseUrl;
}

const BASE_URL = resolveEventBaseUrl();
const MAX_RECONNECT_DELAY_MS = 30_000;

let activeController: AbortController | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let manualDisconnect = false;

const handlers = new Map<string, Set<EventHandler>>();
const globalHandlers = new Set<EventHandler>();

const connected = ref(false);
const connectionState = ref<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'>(
  'idle'
);
const lastEventAt = ref<string | null>(null);

function getReconnectDelay(): number {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY_MS);
  return Math.round(delay + Math.random() * 500);
}

function dispatchEvent(event: DomainEvent): void {
  lastEventAt.value = event.timestamp ?? new Date().toISOString();

  const typeHandlers = handlers.get(event.type);
  if (typeHandlers) {
    typeHandlers.forEach((handler) => handler(event));
  }

  globalHandlers.forEach((handler) => handler(event));
}

function parseEventBlock(block: string): DomainEvent | null {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  let type: string | null = null;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      type = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!type || type === 'connected' || dataLines.length === 0) {
    return null;
  }

  const rawPayload = dataLines.join('\n');

  try {
    const parsed = JSON.parse(rawPayload) as Partial<DomainEvent>;
    return {
      type: type || parsed.type || 'message',
      payload: (parsed.payload as Record<string, unknown>) ?? {},
      timestamp: parsed.timestamp ?? new Date().toISOString(),
    };
  } catch {
    return {
      type,
      payload: { raw: rawPayload },
      timestamp: new Date().toISOString(),
    };
  }
}

async function streamEvents(controller: AbortController, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/events/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed: ${response.status}`);
  }

  connected.value = true;
  connectionState.value = 'connected';
  reconnectAttempt = 0;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const event = parseEventBlock(block);
        if (event) {
          dispatchEvent(event);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function scheduleReconnect(): void {
  if (manualDisconnect || reconnectTimer) return;

  reconnectAttempt++;
  connectionState.value = 'reconnecting';
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, getReconnectDelay());
}

function connect(): void {
  if (activeController) return;

  const token = getAccessToken();
  if (!token) {
    connected.value = false;
    reconnectAttempt = 0;
    connectionState.value = 'idle';
    return;
  }

  manualDisconnect = false;
  connectionState.value = reconnectAttempt > 0 ? 'reconnecting' : 'connecting';

  const controller = new AbortController();
  activeController = controller;

  void streamEvents(controller, token)
    .catch(() => {
      if (manualDisconnect) return;
      connected.value = false;
      scheduleReconnect();
    })
    .finally(() => {
      if (activeController === controller) {
        activeController = null;
      }

      if (manualDisconnect) {
        connected.value = false;
        connectionState.value = 'disconnected';
        return;
      }

      if (connected.value) {
        connected.value = false;
        scheduleReconnect();
      }
    });
}

function disconnect(): void {
  manualDisconnect = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (activeController) {
    activeController.abort();
    activeController = null;
  }

  connected.value = false;
  reconnectAttempt = 0;
  connectionState.value = 'disconnected';
}

function onEvent(type: string, handler: EventHandler): () => void {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)?.add(handler);

  return () => {
    handlers.get(type)?.delete(handler);
    if (handlers.get(type)?.size === 0) {
      handlers.delete(type);
    }
  };
}

function onAnyEvent(handler: EventHandler): () => void {
  globalHandlers.add(handler);
  return () => {
    globalHandlers.delete(handler);
  };
}

export function useEventStream() {
  const unsubscribers: Array<() => void> = [];

  function on(type: string, handler: EventHandler): void {
    unsubscribers.push(onEvent(type, handler));
  }

  function onAll(handler: EventHandler): void {
    unsubscribers.push(onAnyEvent(handler));
  }

  onUnmounted(() => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  });

  return {
    connected,
    connectionState,
    lastEventAt,
    connect,
    disconnect,
    on,
    onAll,
  };
}

export { connect as connectEventStream, disconnect as disconnectEventStream, onAnyEvent, onEvent };
