/**
 * Tests for apps/ui/src/api/contracts.ts
 *
 * Covers:
 * - createSuccess / createFailure builders
 * - normalizeApiError edge cases
 * - normalizeApiResult envelope detection
 * - toPagedResult normalization from various shapes
 */
import { describe, it, expect } from 'vitest';
import {
  createSuccess,
  createFailure,
  normalizeApiError,
  normalizeApiResult,
  toPagedResult,
} from '../api/contracts';

describe('contracts.ts — createSuccess / createFailure', () => {
  it('createSuccess wraps data in ok:true envelope', () => {
    const result = createSuccess({ id: 1 });
    expect(result).toEqual({ ok: true, data: { id: 1 } });
  });

  it('createFailure wraps error in ok:false envelope', () => {
    const result = createFailure({ code: 'ERR', message: 'fail' });
    expect(result).toEqual({ ok: false, error: { code: 'ERR', message: 'fail' } });
  });
});

describe('contracts.ts — normalizeApiError', () => {
  it('handles null/undefined', () => {
    expect(normalizeApiError(null)).toEqual({ code: 'UNKNOWN', message: 'Unknown error' });
    expect(normalizeApiError(undefined)).toEqual({ code: 'UNKNOWN', message: 'Unknown error' });
  });

  it('handles string error', () => {
    expect(normalizeApiError('something broke')).toEqual({
      code: 'UNKNOWN',
      message: 'something broke',
    });
  });

  it('handles object with message', () => {
    const err = { code: 'VALIDATION', message: 'Invalid input', status: 400 };
    expect(normalizeApiError(err)).toEqual({
      code: 'VALIDATION',
      message: 'Invalid input',
      details: undefined,
      status: 400,
    });
  });

  it('handles object with error field instead of message', () => {
    const err = { error: 'Not found' };
    const result = normalizeApiError(err);
    expect(result.message).toBe('Not found');
  });

  it('handles object with no message/error fields', () => {
    const err = { status: 500 };
    expect(normalizeApiError(err)).toEqual({ code: 'UNKNOWN', message: 'Unknown error' });
  });
});

describe('contracts.ts — normalizeApiResult', () => {
  it('normalizes standard ok:true envelope', () => {
    const raw = { ok: true, data: [1, 2, 3] };
    const result = normalizeApiResult<number[]>(raw);
    expect(result).toEqual({ ok: true, data: [1, 2, 3] });
  });

  it('normalizes standard ok:false envelope', () => {
    const raw = { ok: false, error: { code: 'ERR', message: 'fail' } };
    const result = normalizeApiResult(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ERR');
    }
  });

  it('applies mapData transform when provided', () => {
    const raw = { ok: true, data: { x: 10 } };
    const result = normalizeApiResult<number>(raw, (d) => d.x * 2);
    expect(result).toEqual({ ok: true, data: 20 });
  });

  it('handles null response', () => {
    const result = normalizeApiResult(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_RESPONSE');
    }
  });

  it('handles raw data without envelope (fallback)', () => {
    const raw = { id: 1, name: 'product' };
    const result = normalizeApiResult<{ id: number; name: string }>(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: 1, name: 'product' });
    }
  });
});

describe('contracts.ts — toPagedResult', () => {
  it('handles standard { items, total } shape', () => {
    const input = { items: [1, 2, 3], total: 10 };
    const result = toPagedResult<number>(input);
    expect(result).toEqual({ items: [1, 2, 3], total: 10 });
  });

  it('handles nested { data: { items, total } } shape', () => {
    const input = { data: { items: ['a', 'b'], total: 5 } };
    const result = toPagedResult<string>(input);
    expect(result).toEqual({ items: ['a', 'b'], total: 5 });
  });

  it('handles raw array', () => {
    const input = [1, 2, 3];
    const result = toPagedResult<number>(input);
    expect(result).toEqual({ items: [1, 2, 3], total: 3 });
  });

  it('handles empty/invalid input', () => {
    const result = toPagedResult(null);
    expect(result).toEqual({ items: [], total: 0 });
  });
});
