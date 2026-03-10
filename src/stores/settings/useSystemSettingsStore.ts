import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { settingsApi } from '../../services/settingsApi';
import type { SystemSettings } from '../../types/settings/SystemSettings';

const STALE_MS = 5 * 60 * 1000;

export const useSystemSettingsStore = defineStore('systemSettings', () => {
  const data = ref<SystemSettings | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetched = ref<Date | null>(null);

  const isLoaded = computed(() => data.value !== null);
  const isStale = computed(() => {
    if (!lastFetched.value) return true;
    return Date.now() - lastFetched.value.getTime() > STALE_MS;
  });

  async function fetch(force = false) {
    if (isLoaded.value && !isStale.value && !force) return;
    loading.value = true;
    error.value = null;
    try {
      const result = await settingsApi.system.get();
      if (result.ok) {
        data.value = result.data;
        lastFetched.value = new Date();
      } else {
        error.value = result.error?.message ?? 'Unknown error';
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  async function update(payload: Partial<SystemSettings>) {
    loading.value = true;
    error.value = null;
    try {
      const result = await settingsApi.system.update(payload);
      if (result.ok) {
        data.value = result.data;
      } else {
        error.value = result.error?.message ?? 'Unknown error';
        throw new Error(error.value!);
      }
    } catch (e) {
      if (!error.value) error.value = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    data.value = null;
    loading.value = false;
    error.value = null;
    lastFetched.value = null;
  }

  return { data, loading, error, isLoaded, isStale, fetch, update, reset };
});
