import { defineStore } from 'pinia';
import { ref } from 'vue';

function readStoredTheme(): string {
  try {
    return localStorage.getItem('vuetify-theme') || 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Vuetify theme store — manages the current theme selection.
 *
 * NOTE: `useTheme()` cannot be called at store definition time because
 * Vuetify may not yet be installed. The `toggleTheme` function is now
 * designed to receive the theme object from the component that calls it,
 * or it can be used via the `initTheme` +  `toggleTheme` pattern.
 */
export const useVuetifyStore = defineStore('vuetify', () => {
  const theme = ref(readStoredTheme());

  const toggleTheme = () => {
    // Toggle between 'light' and 'dark'
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('vuetify-theme', theme.value);
    } catch {
      /* noop */
    }
  };

  return { theme, toggleTheme };
});
