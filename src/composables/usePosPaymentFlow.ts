/**
 * POS Payment Flow composable — manages payment overlay UI state and submission guards.
 *
 * Handles: open/close, processing lock, double-submission prevention,
 * and post-completion cooldown.
 *
 * Does NOT contain business logic, API calls, or receipt printing.
 * Those remain in PosView for type safety with SaleInput.
 */
import { ref } from 'vue';

export function usePosPaymentFlow() {
  const payOpen = ref(false);
  const isProcessing = ref(false);

  // Cooldown flag to prevent accidental re-trigger right after a successful sale
  const postCompletionLock = ref(false);
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Open the payment overlay.
   * Blocked if already processing or in post-completion cooldown.
   */
  function openPayment(): boolean {
    if (isProcessing.value || postCompletionLock.value) return false;
    payOpen.value = true;
    return true;
  }

  /**
   * Close the payment overlay (e.g. Escape).
   * Blocked while processing to prevent accidental dismiss.
   */
  function closePayment(): boolean {
    if (isProcessing.value) return false;
    payOpen.value = false;
    return true;
  }

  /**
   * Begin processing a payment. Returns false if already processing (double-submit guard).
   */
  function beginProcessing(): boolean {
    if (isProcessing.value || postCompletionLock.value) return false;
    isProcessing.value = true;
    return true;
  }

  /**
   * End processing after success or failure.
   * On success, activates a brief cooldown to prevent accidental re-trigger.
   */
  function endProcessing(success: boolean): void {
    isProcessing.value = false;

    if (success) {
      payOpen.value = false;
      postCompletionLock.value = true;

      // Brief 500ms cooldown after successful sale
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        postCompletionLock.value = false;
        cooldownTimer = null;
      }, 500);
    }
  }

  /**
   * Clean up timers (call from onUnmounted).
   */
  function dispose(): void {
    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
  }

  return {
    payOpen,
    isProcessing,
    openPayment,
    closePayment,
    beginProcessing,
    endProcessing,
    dispose,
  };
}
