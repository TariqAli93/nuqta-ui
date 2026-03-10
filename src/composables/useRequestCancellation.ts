/**
 * useRequestCancellation — provides an AbortController managed per component lifecycle.
 *
 * On component unmount, all in-flight requests using the provided signal are cancelled.
 * Prevents stale store updates after route navigation.
 */
import { onUnmounted } from 'vue';

export function useRequestCancellation() {
  let controller = new AbortController();

  /** Get the current AbortSignal for passing to API requests. */
  function signal(): AbortSignal {
    return controller.signal;
  }

  /** Abort all in-flight requests and create a fresh controller. */
  function abort() {
    controller.abort();
    controller = new AbortController();
  }

  // Auto-cancel on component unmount
  onUnmounted(() => {
    controller.abort();
  });

  return { signal, abort };
}
