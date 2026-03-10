/**
 * Reactive connection status with health-check polling.
 *
 * Combines browser online/offline events with periodic
 * health checks against the backend.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { http } from '@/api/http';

export type ConnectionState = 'online' | 'offline' | 'syncing' | 'degraded';

const HEALTH_CHECK_INTERVAL_MS = 60_000; // 1 minute
const HEALTH_CHECK_TIMEOUT_MS = 5_000;

// Shared state
const browserOnline = ref(navigator.onLine);
const backendReachable = ref(true);
const syncing = ref(false);

let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let healthCheckRunning = false;

async function checkBackendHealth(): Promise<boolean> {
  if (healthCheckRunning) return backendReachable.value;
  healthCheckRunning = true;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    const response = await http.get('/system/health', {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.status === 200;
  } catch {
    return false;
  } finally {
    healthCheckRunning = false;
  }
}

function startHealthChecks(): void {
  if (healthCheckTimer) return;

  // Immediate first check
  checkBackendHealth().then((ok) => {
    backendReachable.value = ok;
  });

  healthCheckTimer = setInterval(async () => {
    backendReachable.value = await checkBackendHealth();
  }, HEALTH_CHECK_INTERVAL_MS);
}

function stopHealthChecks(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

export function useConnectionStatus() {
  const state = computed<ConnectionState>(() => {
    if (syncing.value) return 'syncing';
    if (!browserOnline.value) return 'offline';
    if (!backendReachable.value) return 'degraded';
    return 'online';
  });

  const isOnline = computed(() => state.value === 'online');

  function onOnline() {
    browserOnline.value = true;
    // Re-check backend immediately on reconnect
    checkBackendHealth().then((ok) => {
      backendReachable.value = ok;
    });
  }

  function onOffline() {
    browserOnline.value = false;
  }

  function setSyncing(value: boolean) {
    syncing.value = value;
  }

  onMounted(() => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    startHealthChecks();
  });

  onUnmounted(() => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    stopHealthChecks();
  });

  return {
    state,
    isOnline,
    browserOnline,
    backendReachable,
    syncing,
    setSyncing,
    checkNow: async () => {
      backendReachable.value = await checkBackendHealth();
    },
  };
}
