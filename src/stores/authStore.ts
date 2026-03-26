import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authClient, registerUnauthorizedHandler, setAccessToken, setRefreshToken } from '../api';
import type { AuthSetupStatus, InitializeAppRequest } from '../api/endpoints/auth';
import type { FirstUserInput, UserPublic } from '../types/domain';
import { notifySuccess } from '@/utils/notify';
import { t } from '@/i18n/t';

/**
 * Navigation callback — set by the router layer so the store
 * never imports router directly (eliminates circular dependency risk
 * and store-layer architecture violation).
 */
type NavigateToLogin = (currentPath?: string) => void;
let _navigateToLogin: NavigateToLogin | null = null;

/** Called once from the router setup to inject navigation capability. */
export function registerAuthNavigator(fn: NavigateToLogin) {
  _navigateToLogin = fn;
}

export const useAuthStore = defineStore('auth', () => {
  function safeParse<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw === 'undefined') return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  const user = ref<UserPublic | null>(safeParse<UserPublic | null>('user', null));
  const permissions = ref<string[]>(safeParse<string[]>('permissions', []));
  const token =
    localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined'
      ? ref(localStorage.getItem('token'))
      : ref<string | null>(null);
  const isAuthenticated = token.value !== null && user.value !== null ? ref(true) : ref(false);

  // Hydrate the HTTP client with the stored token
  if (token.value) {
    setAccessToken(token.value);
  }
  const setupStatus = ref<AuthSetupStatus | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isLoggingOut = ref(false);
  const lastLoginUsers = ref<{ username: string; timestamp: number }[]>([]);

  const currentUser = computed(() =>
    user.value ? { ...user.value, permissions: permissions.value } : null
  );

  const isInitialized = computed(() => setupStatus.value?.isInitialized ?? false);
  const isSetupWizardCompleted = computed(() => setupStatus.value?.wizardCompleted ?? false);

  if (typeof window !== 'undefined') {
    registerUnauthorizedHandler(() => {
      if (token.value || user.value) {
        logout('session_expired');
        _navigateToLogin?.();
      }
    });
  }

  async function checkInitialSetup() {
    loading.value = true;
    error.value = null;
    try {
      const result = await authClient.checkInitialSetup();
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      setupStatus.value = result.data;
      console.log('Initial setup status:', result.data);
      return result;
    } catch (err: any) {
      error.value = err.message || 'Failed to check setup status';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function initializeApp(payload: InitializeAppRequest) {
    loading.value = true;
    error.value = null;
    try {
      const result = await authClient.initializeApp(payload);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      // Mark as initialized locally
      setupStatus.value = {
        isInitialized: true,
        hasUsers: true,
        hasCompanyInfo: true,
        wizardCompleted: false,
      };

      return result;
    } catch (err: any) {
      error.value = err.message || 'Initialization failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // helper function to save user data to local storage
  function saveUserData(data: any) {
    user.value = data.user;
    permissions.value = data.permissions || [];
    token.value = data.accessToken;
    isAuthenticated.value = true;

    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
  }

  async function login(credentials: { username: string; password: string }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await authClient.login(credentials);
      const { ok } = result;

      if (!ok) {
        throw new Error(result.error?.message);
      }

      saveUserData(result.data);

      notifySuccess(t('auth.loginSuccess'));

      // Start session check after successful login
      startSessionCheck();

      return result;
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createFirstUser(userData: FirstUserInput) {
    loading.value = true;
    error.value = null;
    try {
      const result = await authClient.createFirstUser(userData);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      user.value = result.data.user;
      permissions.value = result.data.permissions || [];
      token.value = result.data.accessToken;
      isAuthenticated.value = true;

      if (setupStatus.value) {
        setupStatus.value = { ...setupStatus.value, isInitialized: true, hasUsers: true };
      }

      setAccessToken(result.data.accessToken);
      if (result.data.refreshToken) setRefreshToken(result.data.refreshToken);
      localStorage.setItem('token', result.data.accessToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      localStorage.setItem('permissions', JSON.stringify(result.data.permissions || []));

      startSessionCheck();

      setupStatus.value = {
        isInitialized: true,
        hasUsers: true,
        hasCompanyInfo: false,
        wizardCompleted: true,
      };

      return result;
    } catch (err: any) {
      error.value = err.message || 'Setup failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function ensureAuthenticated(): Promise<boolean> {
    if (!token.value) {
      isAuthenticated.value = false;
      return false;
    }

    try {
      const result = await authClient.getCurrentUser();
      if (result.ok) {
        user.value = result.data;
        permissions.value = result.data.permissions || [];
        isAuthenticated.value = true;
        return true;
      } else {
        logout('invalid_token');
        isAuthenticated.value = false;
        return false;
      }
    } catch {
      logout('invalid_token');
      isAuthenticated.value = false;
      return false;
    }
  }

  let sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  function startSessionCheck(intervalMs = 60_000) {
    stopSessionCheck();
    sessionCheckInterval = setInterval(async () => {
      if (!token.value) return;
      try {
        const result = await authClient.getCurrentUser();
        if (!result.ok) {
          logout('session_check_failed');
          _navigateToLogin?.();
        }
      } catch {
        logout('session_check_error');
        _navigateToLogin?.();
      }
    }, intervalMs);
  }

  function stopSessionCheck() {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
      sessionCheckInterval = null;
    }
  }

  async function validateToken(): Promise<boolean> {
    try {
      const result = await authClient.validateToken();
      return result.ok;
    } catch (err) {
      return false;
    }
  }

  function logout(reason?: string) {
    if (isLoggingOut.value) return;
    isLoggingOut.value = true;

    try {
      stopSessionCheck();

      if (reason && reason !== 'not_authenticated' && reason !== 'invalid_token') {
        notifySuccess(t(`auth.logout.${reason}` as any));
      }

      // void authClient.logout();

      user.value = null;
      permissions.value = [];
      token.value = null;
      isAuthenticated.value = false;
      error.value = null;

      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    } finally {
      isLoggingOut.value = false;
    }
  }

  return {
    user,
    permissions,
    token,
    currentUser,
    isAuthenticated,
    setupStatus,
    isInitialized,
    isSetupWizardCompleted,
    loading,
    error,
    checkInitialSetup,
    initializeApp,
    login,
    createFirstUser,
    ensureAuthenticated,
    logout,
    validateToken,
    startSessionCheck,
    stopSessionCheck,
  };
});
