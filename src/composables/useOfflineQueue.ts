/**
 * Offline mutation queue — queues write operations when offline
 * and replays them when connectivity is restored.
 *
 * Uses in-memory storage with optional IndexedDB persistence (Phase 2).
 */
import { ref, onMounted, onUnmounted } from 'vue';
import type { ApiResult } from '@/api/contracts';

export interface QueuedOperation {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  timestamp: number;
  retries: number;
}

type OperationExecutor = (op: QueuedOperation) => Promise<ApiResult<unknown>>;

// Module-level queue state (shared across composable instances)
const queue = ref<QueuedOperation[]>([]);
const isSyncing = ref(false);
let executor: OperationExecutor | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Register the executor function that replays queued operations.
 * Typically called once during app initialization.
 */
export function registerQueueExecutor(fn: OperationExecutor): void {
  executor = fn;
}

/**
 * Add an operation to the offline queue.
 */
export function enqueueOperation(
  method: QueuedOperation['method'],
  url: string,
  data?: unknown,
): void {
  queue.value.push({
    id: generateId(),
    method,
    url,
    data,
    timestamp: Date.now(),
    retries: 0,
  });
}

/**
 * Replay all queued operations in FIFO order.
 * Failed operations are kept in the queue for retry.
 */
async function replayQueue(): Promise<void> {
  if (!executor || isSyncing.value || queue.value.length === 0) return;

  isSyncing.value = true;

  const toProcess = [...queue.value];
  const failed: QueuedOperation[] = [];

  for (const op of toProcess) {
    try {
      const result = await executor(op);
      if (!result.ok) {
        op.retries++;
        if (op.retries < 3) {
          failed.push(op);
        }
        // After 3 retries, drop the operation
      }
    } catch {
      op.retries++;
      if (op.retries < 3) {
        failed.push(op);
      }
    }
  }

  queue.value = failed;
  isSyncing.value = false;
}

/**
 * Vue composable for offline queue management.
 * Monitors connectivity and replays queue on reconnection.
 */
export function useOfflineQueue() {
  const isOnline = ref(navigator.onLine);

  function updateStatus() {
    const wasOffline = !isOnline.value;
    isOnline.value = navigator.onLine;

    // Replay queue when coming back online
    if (wasOffline && isOnline.value) {
      replayQueue();
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  });

  onUnmounted(() => {
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
  });

  return {
    isOnline,
    isSyncing,
    queue,
    queueSize: ref(queue.value.length),
    enqueue: enqueueOperation,
    replay: replayQueue,
  };
}
