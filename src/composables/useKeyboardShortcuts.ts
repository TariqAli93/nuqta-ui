/**
 * Composable for registering keyboard shortcuts scoped to component lifecycle.
 * Auto-cleans up on component unmount.
 */
import { onMounted, onUnmounted } from 'vue';

export interface ShortcutDefinition {
  /** Key code (e.g., 'F1', 'F2', 'Escape', 'Enter') */
  key: string;
  /** Optional modifier keys */
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Handler function */
  handler: (e: KeyboardEvent) => void;
  /** Human-readable label for help display */
  label?: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  function handleKeydown(e: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in inputs/textareas
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow function keys and Escape even in inputs
      if (!e.key.startsWith('F') && e.key !== 'Escape') {
        return;
      }
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key === shortcut.key;
      const ctrlMatch = !shortcut.ctrl || (e.ctrlKey || e.metaKey);
      const shiftMatch = !shortcut.shift || e.shiftKey;
      const altMatch = !shortcut.alt || e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.handler(e);
        return;
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return { shortcuts };
}
