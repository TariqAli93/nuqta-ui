/**
 * Tests for apps/ui/src/composables/useRequestCancellation.ts
 *
 * Covers:
 * - signal() returns a valid AbortSignal
 * - abort() aborts the current controller and creates a fresh one
 * - Multiple abort cycles work correctly
 */
import { describe, it, expect, vi } from 'vitest';

// Mock onUnmounted since we're testing outside a component lifecycle
vi.mock('vue', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    onUnmounted: vi.fn(),
  };
});

import { useRequestCancellation } from '../composables/useRequestCancellation';

describe('useRequestCancellation', () => {
  it('signal() returns a valid AbortSignal', () => {
    const { signal } = useRequestCancellation();
    const s = signal();
    expect(s).toBeInstanceOf(AbortSignal);
    expect(s.aborted).toBe(false);
  });

  it('abort() aborts the current signal', () => {
    const { signal, abort } = useRequestCancellation();
    const s = signal();
    expect(s.aborted).toBe(false);

    abort();
    expect(s.aborted).toBe(true);
  });

  it('abort() creates a fresh controller — new signal is not aborted', () => {
    const { signal, abort } = useRequestCancellation();
    const oldSignal = signal();

    abort();
    expect(oldSignal.aborted).toBe(true);

    const newSignal = signal();
    expect(newSignal.aborted).toBe(false);
  });

  it('multiple abort cycles work correctly', () => {
    const { signal, abort } = useRequestCancellation();

    const s1 = signal();
    abort();
    expect(s1.aborted).toBe(true);

    const s2 = signal();
    abort();
    expect(s2.aborted).toBe(true);

    const s3 = signal();
    expect(s3.aborted).toBe(false);
  });
});
