/**
 * SSE (Server-Sent Events) client composable with auto-reconnect.
 *
 * Connects to the backend's /events/stream endpoint and dispatches
 * domain events to registered handlers.
 */
import { ref, onUnmounted } from 'vue';
import { getAccessToken } from '@/api/http';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

type EventHandler = (event: DomainEvent) => void;

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

// Shared state — only one SSE connection per app
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
const MAX_RECONNECT_DELAY_MS = 30_000;
const handlers = new Map<string, Set<EventHandler>>();
const globalHandlers = new Set<EventHandler>();

const connected = ref(false);

function getReconnectDelay(): number {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY_MS);
  return delay + Math.random() * 500; // jitter
}

function dispatchEvent(event: DomainEvent): void {
  // Type-specific handlers
  const typeHandlers = handlers.get(event.type);
  if (typeHandlers) {
    typeHandlers.forEach((handler) => handler(event));
  }

  // Global handlers (receive all events)
  globalHandlers.forEach((handler) => handler(event));
}

function connect(): void {
  if (eventSource) return;

  const token = getAccessToken();
  if (!token) return;

  // EventSource doesn't support custom headers, so pass token as query param.
  // The SSE endpoint should accept ?token= as an alternative auth method.
  // For now, we use a standard URL and rely on cookie-based auth or a proxy.
  // Fallback: use fetch-based SSE for header support.
  const url = `${BASE_URL}/events/stream`;

  try {
    // Use fetch-based SSE to support Authorization header
    const abortController = new AbortController();

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        connected.value = true;
        reconnectAttempt = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEventType: string | null = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (currentEventType && currentEventType !== 'connected') {
                try {
                  const parsed = JSON.parse(dataStr) as DomainEvent;
                  dispatchEvent(parsed);
                } catch {
                  // Ignore malformed events
                }
              }
              currentEventType = null;
            } else if (line.startsWith(':')) {
              // Comment/heartbeat — ignore
            }
          }
        }

        // Stream ended — attempt reconnect
        connected.value = false;
        scheduleReconnect();
      })
      .catch(() => {
        connected.value = false;
        scheduleReconnect();
      });

    // Store abort controller so disconnect() can close it
    (eventSource as unknown) = abortController;
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  reconnectAttempt++;
  const delay = getReconnectDelay();

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    eventSource = null;
    connect();
  }, delay);
}

function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (eventSource) {
    if (eventSource instanceof AbortController) {
      eventSource.abort();
    }
    eventSource = null;
  }

  connected.value = false;
  reconnectAttempt = 0;
}

/**
 * Register a handler for a specific event type.
 * Returns an unsubscribe function.
 */
function onEvent(type: string, handler: EventHandler): () => void {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)!.add(handler);

  return () => {
    handlers.get(type)?.delete(handler);
    if (handlers.get(type)?.size === 0) {
      handlers.delete(type);
    }
  };
}

/**
 * Register a handler that receives all events.
 * Returns an unsubscribe function.
 */
function onAnyEvent(handler: EventHandler): () => void {
  globalHandlers.add(handler);
  return () => {
    globalHandlers.delete(handler);
  };
}

/**
 * Vue composable for SSE event stream.
 * Manages connection lifecycle and provides event subscription helpers.
 * Auto-disconnects handlers registered within the component on unmount.
 */
export function useEventStream() {
  const unsubscribers: Array<() => void> = [];

  function on(type: string, handler: EventHandler): void {
    unsubscribers.push(onEvent(type, handler));
  }

  function onAll(handler: EventHandler): void {
    unsubscribers.push(onAnyEvent(handler));
  }

  onUnmounted(() => {
    unsubscribers.forEach((unsub) => unsub());
  });

  return {
    connected,
    connect,
    disconnect,
    on,
    onAll,
  };
}

// Export module-level functions for the event bridge
export { connect as connectEventStream, disconnect as disconnectEventStream, onEvent, onAnyEvent };
