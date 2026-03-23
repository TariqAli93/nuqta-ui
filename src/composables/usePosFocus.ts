/**
 * POS Focus management composable — centralizes search input focus restoration.
 *
 * Avoids scattered setTimeout hacks by providing a single requestFocus()
 * that respects dialog-open state and uses nextTick for reliability.
 */
import { nextTick, type Ref } from 'vue';

export function usePosFocus(
  searchField: Ref<{ $el?: HTMLElement } | null>,
  anyDialogOpen: Ref<boolean>
) {
  let searchInput: HTMLInputElement | null = null;

  function resolveSearchInput(): void {
    searchInput =
      (searchField.value?.$el?.querySelector('input') as HTMLInputElement | null) ?? null;
  }

  /**
   * Request focus on the search/barcode input.
   * - Skips if a dialog/overlay is currently open
   * - Uses nextTick + rAF for reliable DOM timing
   */
  function requestFocus(): void {
    if (anyDialogOpen.value) return;

    // Use nextTick to wait for Vue DOM updates, then rAF for browser paint
    void nextTick(() => {
      requestAnimationFrame(() => {
        if (anyDialogOpen.value) return;
        if (!searchInput) resolveSearchInput();
        searchInput?.focus();
      });
    });
  }

  /**
   * Force focus immediately (for initial mount, ignores dialog state).
   */
  function forceFocus(): void {
    if (!searchInput) resolveSearchInput();
    searchInput?.focus();
  }

  return {
    resolveSearchInput,
    requestFocus,
    forceFocus,
  };
}
