/**
 * Global test setup for @nuqtaplus/ui
 *
 * Runs before every test file.
 * Sets up global mocks (localStorage, matchMedia, etc.)
 * so tests can run in happy-dom without browser APIs missing.
 */

// Stub matchMedia for Vuetify
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Ensure ResizeObserver is available
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
