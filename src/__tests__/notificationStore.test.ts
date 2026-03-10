/**
 * Tests for apps/ui/src/stores/notificationStore.ts
 *
 * Covers:
 * - showMessage: returns id, calls the correct toast type
 * - success / error / info / warn: delegate to showMessage correctly
 * - Deduplication: same message within dedupe window returns existing id
 * - Deduplication: same message after window expires creates new toast
 * - Custom dedupeKey: uses explicit key rather than message
 * - persistent: overrides timeout to 0
 * - remove: calls toast.dismiss with id
 * - clear: calls toast.dismissAll
 * - setPosition: updates defaultPosition
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNotificationStore } from '@/stores/notificationStore';

// Mock vue-toastflow to avoid real DOM interactions
vi.mock('vue-toastflow', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  },
}));

describe('notificationStore — showMessage', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns a string toast id', () => {
    const id = store.showMessage('Hello', 'info');
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^toast_/);
  });

  it('calls toast.success for success type', async () => {
    const { toast } = await import('vue-toastflow');
    store.showMessage('Done!', 'success');
    expect(toast.success).toHaveBeenCalled();
  });

  it('calls toast.error for error type', async () => {
    const { toast } = await import('vue-toastflow');
    store.showMessage('Failed!', 'error');
    expect(toast.error).toHaveBeenCalled();
  });

  it('calls toast.info for info type', async () => {
    const { toast } = await import('vue-toastflow');
    store.showMessage('Notice', 'info');
    expect(toast.info).toHaveBeenCalled();
  });

  it('calls toast.warning for warn type', async () => {
    const { toast } = await import('vue-toastflow');
    store.showMessage('Watch out', 'warn');
    expect(toast.warning).toHaveBeenCalled();
  });
});

describe('notificationStore — convenience methods', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('success() returns an id', async () => {
    const id = store.success('Saved!');
    expect(id).toMatch(/^toast_/);
  });

  it('error() returns an id', () => {
    const id = store.error('Something broke');
    expect(id).toMatch(/^toast_/);
  });

  it('info() returns an id', () => {
    const id = store.info('FYI');
    expect(id).toMatch(/^toast_/);
  });

  it('warn() returns an id', () => {
    const id = store.warn('Careful');
    expect(id).toMatch(/^toast_/);
  });
});

describe('notificationStore — deduplication', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    // Clear accumulated call counts from other describe blocks
    vi.clearAllMocks();
    setActivePinia(createPinia());
    store = useNotificationStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns same id for duplicate message within dedupe window', async () => {
    const { toast } = await import('vue-toastflow');

    const id1 = store.showMessage('Duplicate!', 'info', { dedupeWindowMs: 3000 });
    vi.advanceTimersByTime(1000); // still within window
    const id2 = store.showMessage('Duplicate!', 'info', { dedupeWindowMs: 3000 });

    expect(id1).toBe(id2);
    // toast should only be shown once
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it('creates a new toast after dedupe window expires', async () => {
    const { toast } = await import('vue-toastflow');

    const id1 = store.showMessage('Msg', 'success', { dedupeWindowMs: 1000 });
    vi.advanceTimersByTime(2000); // past the window
    const id2 = store.showMessage('Msg', 'success', { dedupeWindowMs: 1000 });

    expect(id1).not.toBe(id2);
    expect(toast.success).toHaveBeenCalledTimes(2);
  });

  it('uses explicit dedupeKey instead of message text', async () => {
    const { toast } = await import('vue-toastflow');

    const id1 = store.showMessage('Message A', 'info', { dedupeKey: 'shared-key' });
    const id2 = store.showMessage('Message B', 'info', { dedupeKey: 'shared-key' });

    // Both use the same dedupeKey, so second is a no-op
    expect(id1).toBe(id2);
    expect(toast.info).toHaveBeenCalledTimes(1);
  });

  it('different messages are NOT deduplicated', async () => {
    const { toast } = await import('vue-toastflow');

    store.showMessage('Message X', 'info');
    store.showMessage('Message Y', 'info');

    expect(toast.info).toHaveBeenCalledTimes(2);
  });
});

describe('notificationStore — persistent toasts', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets duration to 0 for persistent toasts', async () => {
    const { toast } = await import('vue-toastflow');

    store.showMessage('Stay here', 'info', { persistent: true });

    expect(toast.info).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 0 })
    );
  });
});

describe('notificationStore — remove and clear', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('remove() calls toast.dismiss with the given id', async () => {
    const { toast } = await import('vue-toastflow');
    store.remove('toast_abc_123');
    expect(toast.dismiss).toHaveBeenCalledWith('toast_abc_123');
  });

  it('clear() calls toast.dismissAll', async () => {
    const { toast } = await import('vue-toastflow');
    store.clear();
    expect(toast.dismissAll).toHaveBeenCalled();
  });
});

describe('notificationStore — setPosition', () => {
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with top-center as default position', () => {
    expect(store.defaultPosition).toBe('top-center');
  });

  it('updates defaultPosition on setPosition call', () => {
    store.setPosition('bottom-right');
    expect(store.defaultPosition).toBe('bottom-right');
  });

  it('new toasts use the updated default position', async () => {
    const { toast } = await import('vue-toastflow');
    store.setPosition('bottom-left');
    store.info('Test message');

    expect(toast.info).toHaveBeenCalledWith(
      expect.objectContaining({ position: 'bottom-left' })
    );
  });

  it('opts.position overrides defaultPosition per-toast', async () => {
    const { toast } = await import('vue-toastflow');
    store.setPosition('top-center');
    store.showMessage('Override', 'info', { position: 'top-right' });

    expect(toast.info).toHaveBeenCalledWith(
      expect.objectContaining({ position: 'top-right' })
    );
  });
});
