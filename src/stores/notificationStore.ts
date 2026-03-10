import { defineStore } from 'pinia';
import { ref } from 'vue';
import { toast } from 'vue-toastflow';

type ToastType = 'success' | 'error' | 'info' | 'warn';

export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center';

export interface ToastOptions {
  title?: string;
  timeout?: number;
  persistent?: boolean;
  actionText?: string;
  onAction?: () => void;
  dedupeKey?: string;
  dedupeWindowMs?: number;
  position?: ToastPosition;
}

const DEFAULT_TIMEOUT = 3000;
const DEFAULT_DEDUPE_WINDOW = 3000;
const MAX_DEDUPE_TTL = 60_000; // prune entries older than 60 s to prevent unbounded growth
const dedupeRegistry = new Map<string, { id: string; timestamp: number }>();

function pruneDedupeRegistry(): void {
  const cutoff = Date.now() - MAX_DEDUPE_TTL;
  for (const [key, entry] of dedupeRegistry) {
    if (entry.timestamp < cutoff) dedupeRegistry.delete(key);
  }
}

export const useNotificationStore = defineStore('notification', () => {
  const defaultPosition = ref<string>('top-center');

  function showMessage(message: string, type: ToastType, opts: ToastOptions = {}): string {
    pruneDedupeRegistry();
    const now = Date.now();
    const dedupeKey = opts.dedupeKey ?? message;
    const dedupeWindowMs = opts.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW;

    const lastShown = dedupeRegistry.get(dedupeKey);
    if (lastShown && now - lastShown.timestamp < dedupeWindowMs) {
      return lastShown.id;
    }

    if (opts.persistent) {
      opts.timeout = 0;
    }

    const id = `toast_${now}_${Math.random().toString(36).slice(2, 8)}`;
    let duration = opts.timeout !== undefined ? opts.timeout : DEFAULT_TIMEOUT;
    if (opts.persistent || duration <= 0) {
      duration = 0;
    }

    const actionButton = opts.actionText
      ? [
          {
            label: opts.actionText,
            onClick: () => {
              if (opts.onAction) opts.onAction();
              toast.dismiss(id);
            },
          },
        ]
      : [];

    let tfType: 'success' | 'error' | 'info' | 'warning' = 'info';
    if (type === 'success') tfType = 'success';
    if (type === 'error') tfType = 'error';
    if (type === 'warn') tfType = 'warning';

    try {
      toast[tfType]({
        id,
        title: opts.title,
        description: message,
        duration: opts.persistent ? 0 : duration,
        position: opts.position ?? defaultPosition.value,
        buttons: actionButton.length > 0 ? { buttons: actionButton } : undefined,
      } as never);
    } catch {
      // Toast display failed — swallow to avoid cascading errors
    }

    dedupeRegistry.set(dedupeKey, { id, timestamp: now });
    return id;
  }

  function success(message: string, opts?: ToastOptions): string {
    return showMessage(message, 'success', opts);
  }

  function error(message: string, opts?: ToastOptions): string {
    return showMessage(message, 'error', opts);
  }

  function info(message: string, opts?: ToastOptions): string {
    return showMessage(message, 'info', opts);
  }

  function warn(message: string, opts?: ToastOptions): string {
    return showMessage(message, 'warn', opts);
  }

  function remove(id: string): void {
    try {
      toast.dismiss(id);
    } catch {
      /* noop */
    }
  }

  function clear(): void {
    try {
      toast.dismissAll();
    } catch {
      /* noop */
    }
  }

  function setPosition(position: ToastPosition): void {
    defaultPosition.value = position;
  }

  return {
    defaultPosition,
    showMessage,
    success,
    error,
    info,
    warn,
    remove,
    clear,
    setPosition,
  };
});
