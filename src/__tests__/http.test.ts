/**
 * Tests for apps/ui/src/api/http.ts
 *
 * Covers:
 * - Token management (setAccessToken, getAccessToken)
 * - Bearer header injection via request interceptor
 * - AbortController / cancellation handling
 * - Error normalization (timeout, network, server errors)
 * - axiosErrorToApiError mapping
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import {
  setAccessToken,
  getAccessToken,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  http,
  registerUnauthorizedHandler,
  __resetForTests,
} from '../api/http';

// We mock the http instance methods so we don't make real requests.
vi.mock('axios', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: actual.default.create,
      isCancel: actual.default.isCancel,
    },
  };
});

describe('http.ts — Token management', () => {
  beforeEach(() => {
    __resetForTests();
  });

  it('starts with null token', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setAccessToken('abc-123');
    expect(getAccessToken()).toBe('abc-123');
  });

  it('can clear token by setting null', () => {
    setAccessToken('abc-123');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('setAccessToken does NOT shadow (regression test for original bug)', () => {
    // The original bug: `function setAccessToken(token) { token = token; }`
    // The parameter name shadowed the module var so token was never stored.
    setAccessToken('test-token');
    expect(getAccessToken()).toBe('test-token');

    // Verify a second call doesn't break
    setAccessToken('another');
    expect(getAccessToken()).toBe('another');
  });
});

describe('http.ts — Bearer header injection', () => {
  beforeEach(() => {
    __resetForTests();
  });

  it('attaches Authorization header when token is set', () => {
    setAccessToken('my-jwt');

    // Simulate the request interceptor manually
    const config = {
      headers: {
        set: vi.fn(),
        get: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
      },
    } as any;

    // Use the interceptor logic
    const interceptors = (http.interceptors.request as any).handlers;
    expect(interceptors.length).toBeGreaterThan(0);

    const handler = interceptors[0];
    const result = handler.fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer my-jwt');
  });

  it('does NOT attach Authorization header when token is null', () => {
    setAccessToken(null);

    const config = {
      headers: {
        set: vi.fn(),
        get: vi.fn(),
        has: vi.fn(),
        delete: vi.fn(),
      },
    } as any;

    const interceptors = (http.interceptors.request as any).handlers;
    const handler = interceptors[0];
    const result = handler.fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('http.ts — API helpers', () => {
  beforeEach(() => {
    __resetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('apiGet returns success for valid response', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({
      data: { ok: true, data: { id: 1, name: 'test' } },
    });

    const result = await apiGet<{ id: number; name: string }>('/test');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 1, name: 'test' });
    }
  });

  it('apiGet returns failure for error response', async () => {
    vi.spyOn(http, 'get').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: { error: { code: 'NOT_FOUND', message: 'Not found' } },
      },
      code: undefined,
    });

    const result = await apiGet('/nonexistent');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('apiGet handles cancellation via AbortSignal', async () => {
    const cancelError = new axios.Cancel('Request cancelled');
    vi.spyOn(http, 'get').mockRejectedValue(cancelError);

    const controller = new AbortController();
    const result = await apiGet('/test', undefined, { signal: controller.signal });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CANCELLED');
    }
  });

  it('apiPost sends data and returns success', async () => {
    vi.spyOn(http, 'post').mockResolvedValue({
      data: { ok: true, data: { id: 42 } },
    });

    const result = await apiPost<{ id: number }>('/items', { name: 'new' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe(42);
    }
  });

  it('apiPut sends data and returns success', async () => {
    vi.spyOn(http, 'put').mockResolvedValue({
      data: { ok: true, data: { updated: true } },
    });

    const result = await apiPut<{ updated: boolean }>('/items/1', { name: 'updated' });
    expect(result.ok).toBe(true);
  });

  it('apiDelete returns success', async () => {
    vi.spyOn(http, 'delete').mockResolvedValue({
      data: { ok: true, data: null },
    });

    const result = await apiDelete('/items/1');
    expect(result.ok).toBe(true);
  });

  it('handles network error (no response)', async () => {
    vi.spyOn(http, 'get').mockRejectedValue({
      isAxiosError: true,
      response: undefined,
      code: undefined,
    });

    const result = await apiGet('/offline');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NETWORK_ERROR');
    }
  });

  it('handles timeout error', async () => {
    vi.spyOn(http, 'get').mockRejectedValue({
      isAxiosError: true,
      response: undefined,
      code: 'ECONNABORTED',
    });

    const result = await apiGet('/slow');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
      expect(result.error.status).toBe(408);
    }
  });
});

describe('http.ts — Unauthorized handler', () => {
  beforeEach(() => {
    __resetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls registered handler on 401 error', async () => {
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);

    vi.spyOn(http, 'get').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
        data: { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      },
      code: undefined,
    });

    await apiGet('/protected');
    expect(handler).toHaveBeenCalled();
  });

  it('does not call handler on non-401 errors', async () => {
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);

    vi.spyOn(http, 'get').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: { error: { code: 'SERVER_ERROR', message: 'Internal error' } },
      },
      code: undefined,
    });

    await apiGet('/broken');
    expect(handler).not.toHaveBeenCalled();
  });
});
