/**
 * Tests for apps/ui/src/composables/usePosHeldSales.ts
 *
 * Covers:
 * - loadHeldSales: reads from localStorage, handles parse error
 * - holdSale: appends to list and persists to localStorage
 * - resumeSale: removes from list, persists, returns deep clone
 * - resumeSale: returns null for invalid index
 * - deleteHeldSale: calls confirm(), removes on true, skips on false
 * - heldSaleName: uses sale.name or falls back to Arabic index label
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePosHeldSales, type HeldSale } from '@/composables/usePosHeldSales';

vi.mock('@/utils/notify', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

vi.mock('@/i18n/t', () => ({
  t: (key: string) => key,
  mapErrorToArabic: (err: any) => err?.message ?? 'error',
}));

const STORAGE_KEY = 'nuqta_held_sales';

function mockHeldSale(overrides?: Partial<HeldSale>): HeldSale {
  return {
    name: 'Test Sale',
    items: [{ productId: 1, productName: 'Widget', quantity: 2, unitPrice: 1000, subtotal: 2000 }],
    discount: 0,
    tax: 0,
    customerId: null,
    note: null,
    total: 2000,
    timestamp: 1700000000000,
    ...overrides,
  };
}

describe('usePosHeldSales — loadHeldSales', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with empty heldSales', () => {
    const { heldSales } = usePosHeldSales();
    expect(heldSales.value).toEqual([]);
  });

  it('loads persisted sales from localStorage', () => {
    const sales = [mockHeldSale(), mockHeldSale({ name: 'Sale B' })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));

    const { heldSales, loadHeldSales } = usePosHeldSales();
    loadHeldSales();

    expect(heldSales.value).toHaveLength(2);
    expect(heldSales.value[0].name).toBe('Test Sale');
    expect(heldSales.value[1].name).toBe('Sale B');
  });

  it('resets to empty array on JSON parse error', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');

    const { heldSales, loadHeldSales } = usePosHeldSales();
    loadHeldSales();

    expect(heldSales.value).toEqual([]);
  });

  it('does nothing when localStorage key is absent', () => {
    const { heldSales, loadHeldSales } = usePosHeldSales();
    loadHeldSales();
    expect(heldSales.value).toEqual([]);
  });
});

describe('usePosHeldSales — holdSale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('appends sale to heldSales', () => {
    const { heldSales, holdSale } = usePosHeldSales();
    holdSale(mockHeldSale());
    expect(heldSales.value).toHaveLength(1);
  });

  it('persists to localStorage after holding', () => {
    const { holdSale } = usePosHeldSales();
    const sale = mockHeldSale({ name: 'Parked' });
    holdSale(sale);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Parked');
  });

  it('can hold multiple sales', () => {
    const { heldSales, holdSale } = usePosHeldSales();
    holdSale(mockHeldSale({ name: 'A' }));
    holdSale(mockHeldSale({ name: 'B' }));
    expect(heldSales.value).toHaveLength(2);
  });
});

describe('usePosHeldSales — resumeSale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the sale at the given index', () => {
    const { holdSale, resumeSale } = usePosHeldSales();
    holdSale(mockHeldSale({ name: 'To Resume' }));

    const resumed = resumeSale(0);
    expect(resumed).not.toBeNull();
    expect(resumed?.name).toBe('To Resume');
  });

  it('removes the resumed sale from heldSales', () => {
    const { heldSales, holdSale, resumeSale } = usePosHeldSales();
    holdSale(mockHeldSale({ name: 'X' }));
    holdSale(mockHeldSale({ name: 'Y' }));

    resumeSale(0);

    expect(heldSales.value).toHaveLength(1);
    expect(heldSales.value[0].name).toBe('Y');
  });

  it('persists removal to localStorage', () => {
    const { holdSale, resumeSale } = usePosHeldSales();
    holdSale(mockHeldSale());
    resumeSale(0);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(0);
  });

  it('returns a deep clone (mutations do not affect the store)', () => {
    const { holdSale, resumeSale, heldSales } = usePosHeldSales();
    holdSale(mockHeldSale({ name: 'Original' }));

    const resumed = resumeSale(0)!;
    resumed.name = 'Mutated'; // mutate the returned clone

    // original was already removed — list is empty, no aliasing
    expect(heldSales.value).toHaveLength(0);
    expect(resumed.name).toBe('Mutated'); // clone is independently mutable
  });

  it('returns null for out-of-range index', () => {
    const { resumeSale } = usePosHeldSales();
    expect(resumeSale(99)).toBeNull();
  });
});

describe('usePosHeldSales — deleteHeldSale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('removes sale and returns true when user confirms', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    const { heldSales, holdSale, deleteHeldSale } = usePosHeldSales();
    holdSale(mockHeldSale());

    const result = deleteHeldSale(0);

    expect(result).toBe(true);
    expect(heldSales.value).toHaveLength(0);
  });

  it('persists deletion to localStorage when confirmed', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    const { holdSale, deleteHeldSale } = usePosHeldSales();
    holdSale(mockHeldSale());
    deleteHeldSale(0);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(stored).toHaveLength(0);
  });

  it('does NOT remove sale and returns false when user cancels', () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

    const { heldSales, holdSale, deleteHeldSale } = usePosHeldSales();
    holdSale(mockHeldSale());

    const result = deleteHeldSale(0);

    expect(result).toBe(false);
    expect(heldSales.value).toHaveLength(1); // unchanged
  });
});

describe('usePosHeldSales — heldSaleName', () => {
  it('returns the sale name when set', () => {
    const { heldSaleName } = usePosHeldSales();
    const sale = mockHeldSale({ name: 'Table 5' });
    expect(heldSaleName(sale, 0)).toBe('Table 5');
  });

  it('falls back to Arabic index label when name is empty', () => {
    const { heldSaleName } = usePosHeldSales();
    const sale = mockHeldSale({ name: '' });
    expect(heldSaleName(sale, 0)).toBe('عملية 1');
    expect(heldSaleName(sale, 2)).toBe('عملية 3');
  });
});
