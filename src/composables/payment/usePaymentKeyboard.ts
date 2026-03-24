import { onBeforeUnmount, watch, type ComputedRef } from 'vue';

interface UsePaymentKeyboardOptions {
  isOpen: ComputedRef<boolean>;
  canConfirm: ComputedRef<boolean>;
  pressKey: (key: string) => void;
  clearActiveValue: () => void;
  confirm: () => void;
  close: () => void;
}

export function usePaymentKeyboard(options: UsePaymentKeyboardOptions) {
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (!options.isOpen.value) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      options.pressKey(event.key);
      return;
    }

    if (event.key === '.') {
      event.preventDefault();
      event.stopPropagation();
      options.pressKey('.');
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      event.stopPropagation();
      options.pressKey('backspace');
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      event.stopPropagation();
      options.clearActiveValue();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (options.canConfirm.value) options.confirm();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      options.close();
    }
  }

  watch(options.isOpen, (open) => {
    if (open) {
      window.addEventListener('keydown', handleGlobalKeydown, true);
      return;
    }
    window.removeEventListener('keydown', handleGlobalKeydown, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleGlobalKeydown, true);
  });
}
