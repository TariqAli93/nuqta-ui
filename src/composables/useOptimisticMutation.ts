/**
 * Composable for optimistic mutations — applies changes instantly then
 * reconciles with the server response.
 *
 * Usage:
 *   const { mutate, isPending } = useOptimisticMutation({
 *     execute: (input) => salesClient.create(input),
 *     optimistic: (input) => { store.items.push(fakeItem(input)); },
 *     rollback: (input, snapshot) => { store.items = snapshot; },
 *     onSuccess: (result) => { store.replaceItem(result); },
 *     onError: (error) => { notify.error(error.message); },
 *   });
 */
import { ref } from 'vue';
import type { ApiResult } from '@/api/contracts';

export interface OptimisticMutationOptions<TInput, TResult> {
  /** The actual API call. */
  execute: (input: TInput) => Promise<ApiResult<TResult>>;
  /** Apply the optimistic update before the API call returns. */
  optimistic?: (input: TInput) => void;
  /** Rollback optimistic changes on failure. Receives the original input. */
  rollback?: (input: TInput) => void;
  /** Called with the API result on success. */
  onSuccess?: (result: TResult, input: TInput) => void;
  /** Called with the error on failure. */
  onError?: (error: { code: string; message: string }, input: TInput) => void;
}

export function useOptimisticMutation<TInput, TResult>(
  options: OptimisticMutationOptions<TInput, TResult>,
) {
  const isPending = ref(false);
  const error = ref<string | null>(null);

  async function mutate(input: TInput): Promise<ApiResult<TResult>> {
    isPending.value = true;
    error.value = null;

    // Apply optimistic update
    if (options.optimistic) {
      try {
        options.optimistic(input);
      } catch {
        // If optimistic update itself fails, continue with normal flow
      }
    }

    try {
      const result = await options.execute(input);

      if (result.ok) {
        options.onSuccess?.(result.data, input);
      } else {
        error.value = result.error.message;
        // Rollback optimistic changes
        options.rollback?.(input);
        options.onError?.(result.error, input);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      error.value = message;
      options.rollback?.(input);
      options.onError?.({ code: 'UNKNOWN', message }, input);
      return { ok: false, error: { code: 'UNKNOWN', message } };
    } finally {
      isPending.value = false;
    }
  }

  return {
    mutate,
    isPending,
    error,
  };
}
