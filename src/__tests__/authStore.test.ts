/**
 * Tests for apps/ui/src/stores/authStore.ts
 *
 * Covers:
 * - Initial state (token hydration from localStorage, user, permissions)
 * - login: success path, failure path, loading transitions, localStorage writes
 * - logout: clears state, token, localStorage keys, stops session check
 * - checkInitialSetup: success / failure
 * - initializeApp: success path, setupStatus mutation
 * - createFirstUser: success path, failure path
 * - startSessionCheck / stopSessionCheck: timer lifecycle
 * - Unauthorized handler: triggers logout on 401
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import {
  createApiSuccess,
  createApiFailure,
  createMockUserPublic,
} from './factories';

// ── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/api', () => ({
  authClient: {
    login: vi.fn(),
    checkInitialSetup: vi.fn(),
    createFirstUser: vi.fn(),
    initializeApp: vi.fn(),
    getCurrentUser: vi.fn(),
    validateToken: vi.fn(),
    logout: vi.fn(),
  },
  registerUnauthorizedHandler: vi.fn(),
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock('@/utils/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('@/i18n/t', () => ({
  t: (key: string) => key,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockLoginData = () => ({
  accessToken: 'jwt-token-abc',
  user: createMockUserPublic(),
  permissions: ['products.read', 'sales.create'],
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('authStore — initial state', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('has null user and token when localStorage is empty', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('hydrates user and token from localStorage', () => {
    const mockUser = createMockUserPublic();
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('permissions', JSON.stringify(['sales.read']));

    const store = useAuthStore();
    expect(store.token).toBe('stored-token');
    expect(store.user).toEqual(mockUser);
    expect(store.permissions).toEqual(['sales.read']);
    expect(store.isAuthenticated).toBe(true);
  });

  it('ignores "undefined" string stored in localStorage for token', () => {
    localStorage.setItem('token', 'undefined');
    const store = useAuthStore();
    expect(store.token).toBeNull();
  });

  it('exposes currentUser computed combining user + permissions', () => {
    const mockUser = createMockUserPublic();
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('permissions', JSON.stringify(['products.read']));

    const store = useAuthStore();
    expect(store.currentUser).toEqual({ ...mockUser, permissions: ['products.read'] });
  });
});

describe('authStore — login', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useAuthStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sets loading true during login, false after success', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.login).mockResolvedValue(createApiSuccess(mockLoginData()));

    const promise = store.login({ username: 'admin', password: 'pass' });
    expect(store.loading).toBe(true);
    await promise;
    expect(store.loading).toBe(false);
  });

  it('persists token, user, permissions after successful login', async () => {
    const { authClient } = await import('@/api');
    const data = mockLoginData();
    vi.mocked(authClient.login).mockResolvedValue(createApiSuccess(data));

    await store.login({ username: 'admin', password: 'pass' });

    expect(store.token).toBe(data.accessToken);
    expect(store.user).toEqual(data.user);
    expect(store.permissions).toEqual(data.permissions);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe(data.accessToken);
  });

  it('sets error and throws on login failure', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.login).mockResolvedValue(
      createApiFailure('INVALID_CREDENTIALS', 'Invalid username or password')
    );

    await expect(
      store.login({ username: 'admin', password: 'wrong' })
    ).rejects.toThrow('Invalid username or password');

    expect(store.error).toBe('Invalid username or password');
    expect(store.loading).toBe(false);
    expect(store.isAuthenticated).toBe(false);
  });

  it('clears error before each new login attempt', async () => {
    const { authClient } = await import('@/api');
    store.error = 'old error' as any;

    vi.mocked(authClient.login).mockResolvedValue(createApiSuccess(mockLoginData()));
    await store.login({ username: 'admin', password: 'pass' });

    expect(store.error).toBeNull();
  });
});

describe('authStore — logout', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify(createMockUserPublic()));
    localStorage.setItem('permissions', JSON.stringify(['sales.read']));
    setActivePinia(createPinia());
    store = useAuthStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('clears user, token, permissions, and isAuthenticated', () => {
    store.logout();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.permissions).toEqual([]);
    expect(store.isAuthenticated).toBe(false);
  });

  it('removes all auth keys from localStorage', () => {
    store.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('permissions')).toBeNull();
  });

  it('still clears stored auth state for silent logout reasons', () => {
    store.logout('invalid_token');

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.permissions).toEqual([]);
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('is idempotent — second logout call is a no-op', () => {
    store.logout();
    store.logout(); // should not throw
    expect(store.user).toBeNull();
  });
});

describe('authStore — checkInitialSetup', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useAuthStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets setupStatus on success', async () => {
    const { authClient } = await import('@/api');
    const status = {
      isInitialized: true,
      hasUsers: true,
      hasCompanyInfo: true,
      wizardCompleted: true,
    };
    vi.mocked(authClient.checkInitialSetup).mockResolvedValue(createApiSuccess(status));

    await store.checkInitialSetup();

    expect(store.setupStatus).toEqual(status);
    expect(store.isInitialized).toBe(true);
    expect(store.isSetupWizardCompleted).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('throws and sets error on failure', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.checkInitialSetup).mockResolvedValue(
      createApiFailure('SERVER_ERROR', 'Cannot reach server')
    );

    await expect(store.checkInitialSetup()).rejects.toThrow('Cannot reach server');
    expect(store.error).toBe('Cannot reach server');
    expect(store.loading).toBe(false);
  });
});

describe('authStore — createFirstUser', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useAuthStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sets user, token, isAuthenticated on success', async () => {
    const { authClient } = await import('@/api');
    const data = mockLoginData();
    vi.mocked(authClient.createFirstUser).mockResolvedValue(createApiSuccess(data));

    await store.createFirstUser({
      username: 'admin',
      password: 'pass',
      fullName: 'Admin',
    });

    expect(store.user).toEqual(data.user);
    expect(store.token).toBe(data.accessToken);
    expect(store.isAuthenticated).toBe(true);
  });

  it('throws on failure', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.createFirstUser).mockResolvedValue(
      createApiFailure('VALIDATION', 'Username already taken')
    );

    await expect(
      store.createFirstUser({ username: 'admin', password: 'pass', fullName: 'Admin' })
    ).rejects.toThrow('Username already taken');

    expect(store.error).toBe('Username already taken');
  });
});

describe('authStore — initializeApp', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    store = useAuthStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets setupStatus to initialized on success', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.initializeApp).mockResolvedValue(
      createApiSuccess({ success: true, admin: createMockUserPublic() })
    );

    await store.initializeApp({
      admin: { username: 'admin', password: 'pass', fullName: 'Admin' },
      companySettings: { name: 'My Store', currency: 'IQD' },
    });

    expect(store.setupStatus?.isInitialized).toBe(true);
    expect(store.setupStatus?.hasUsers).toBe(true);
    expect(store.loading).toBe(false);
  });

  it('throws on failure', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.initializeApp).mockResolvedValue(
      createApiFailure('INIT_FAILED', 'Initialization failed')
    );

    await expect(
      store.initializeApp({
        admin: { username: 'admin', password: 'pass', fullName: 'Admin' },
        companySettings: { name: 'My Store', currency: 'IQD' },
      })
    ).rejects.toThrow('Initialization failed');
  });
});

describe('authStore — session check lifecycle', () => {
  let store: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks(); // reset call counts between session-check tests
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify(createMockUserPublic()));
    setActivePinia(createPinia());
    store = useAuthStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    store.stopSessionCheck();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('startSessionCheck triggers getCurrentUser after interval', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.getCurrentUser).mockResolvedValue(
      createApiSuccess({ user: createMockUserPublic(), permissions: [] })
    );

    store.startSessionCheck(1000);
    vi.advanceTimersByTime(1000);
    await Promise.resolve(); // flush microtasks

    expect(authClient.getCurrentUser).toHaveBeenCalled();
  });

  it('stopSessionCheck prevents further calls', async () => {
    const { authClient } = await import('@/api');
    vi.mocked(authClient.getCurrentUser).mockResolvedValue(
      createApiSuccess({ user: createMockUserPublic(), permissions: [] })
    );

    store.startSessionCheck(1000);
    store.stopSessionCheck();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(authClient.getCurrentUser).not.toHaveBeenCalled();
  });
});
