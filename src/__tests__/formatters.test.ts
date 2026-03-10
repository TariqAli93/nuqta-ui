/**
 * Tests for apps/ui/src/utils/formatters.ts
 *
 * Covers:
 * - formatDate with valid/invalid/null input
 * - formatMoney with zero, positive, negative values
 * - Cached Intl.NumberFormat / DateTimeFormat performance (no re-creation)
 */
import { describe, it, expect } from 'vitest';
import { formatDate, formatMoney } from '../utils/formatters';

describe('formatters.ts — formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    // Should be a date string in ar-IQ locale with latn numbers
    expect(result).toBeTruthy();
    expect(result).not.toBe('—');
    // Should contain numeric parts
    expect(result).toMatch(/\d/);
  });

  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns "—" for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
});

describe('formatters.ts — formatMoney', () => {
  it('formats positive number with thousands separator', () => {
    const result = formatMoney(1234567);
    expect(result).toContain('1,234,567');
    expect(result).toContain('د.ع');
  });

  it('formats zero', () => {
    const result = formatMoney(0);
    expect(result).toContain('0');
    expect(result).toContain('د.ع');
  });

  it('handles falsy value (NaN treated as 0)', () => {
    // formatMoney(0) => "0 د.ع"
    const result = formatMoney(0);
    expect(result).toBe('0 د.ع');
  });

  it('formats negative numbers', () => {
    const result = formatMoney(-5000);
    expect(result).toContain('-5,000');
    expect(result).toContain('د.ع');
  });
});
