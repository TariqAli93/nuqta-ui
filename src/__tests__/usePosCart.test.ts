/**
 * Tests for apps/ui/src/composables/usePosCart.ts
 *
 * Covers:
 * - Initial state: empty cartItems, zero subtotal/total, zero discount/tax
 * - addToCart: new product adds item, same product+unit increments quantity
 * - addToCart: uses default unit price when no units available
 * - addToCart: skips when zero-price product and user cancels confirm
 * - increaseQuantity / decreaseQuantity: quantity changes, auto-remove at 0
 * - removeFromCart: removes item, returns 'confirm-needed' for last item
 * - confirmRemoveAt: removes item unconditionally
 * - resetCart: clears all state
 * - applyDiscount: clamped to [0, subtotal], ignored if invalid
 * - subtotal / total computed values
 * - handleUnitChange: updates unit fields and recalculates subtotal
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePosCart } from '@/composables/usePosCart';
import { createMockProduct, createMockProductUnit, createApiSuccess } from './factories';

vi.mock('@/api', () => ({
  productsClient: {
    getUnits: vi.fn(),
  },
}));

vi.mock('@/i18n/t', () => ({
  t: (key: string) => key,
}));

describe('usePosCart — initial state', () => {
  it('starts with empty cart and zero computed values', () => {
    const { cartItems, subtotal, total, discount, tax } = usePosCart();
    expect(cartItems.value).toEqual([]);
    expect(subtotal.value).toBe(0);
    expect(total.value).toBe(0);
    expect(discount.value).toBe(0);
    expect(tax.value).toBe(0);
  });
});

describe('usePosCart — addToCart', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds a new item when product not in cart', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart } = usePosCart();
    const product = createMockProduct({ id: 1, sellingPrice: 1500, unit: 'piece' });

    const result = await addToCart(product);

    expect(result).toBe(true);
    expect(cartItems.value).toHaveLength(1);
    expect(cartItems.value[0].productId).toBe(1);
    expect(cartItems.value[0].quantity).toBe(1);
    expect(cartItems.value[0].unitPrice).toBe(1500);
  });

  it('increments quantity when same product+unit is added again', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart } = usePosCart();
    const product = createMockProduct({ id: 2, sellingPrice: 1000, unit: 'pcs' });

    await addToCart(product);
    await addToCart(product);

    expect(cartItems.value).toHaveLength(1);
    expect(cartItems.value[0].quantity).toBe(2);
  });

  it('uses default unit price and name from active units', async () => {
    const { productsClient } = await import('@/api');
    const defaultUnit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 5000,
      isDefault: true,
      isActive: true,
      factorToBase: 12,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([defaultUnit]));

    const { cartItems, addToCart } = usePosCart();
    const product = createMockProduct({ id: 3, sellingPrice: 999 }); // product price ignored

    await addToCart(product);

    expect(cartItems.value[0].unitPrice).toBe(5000);
    expect(cartItems.value[0].unitName).toBe('box');
    expect(cartItems.value[0].unitFactor).toBe(12);
    expect(cartItems.value[0].quantityBase).toBe(12); // 1 × 12
  });

  it('sets quantityBase = 1 when no units configured (factor defaults to 1)', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart } = usePosCart();
    await addToCart(createMockProduct({ id: 10, sellingPrice: 1000 }));

    expect(cartItems.value[0].unitFactor).toBe(1);
    expect(cartItems.value[0].quantityBase).toBe(1);
  });

  it('increments quantityBase when same product+unit is added again', async () => {
    const { productsClient } = await import('@/api');
    const unit = createMockProductUnit({
      unitName: 'carton',
      sellingPrice: 12000,
      isDefault: true,
      isActive: true,
      factorToBase: 12,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([unit]));

    const { cartItems, addToCart } = usePosCart();
    const product = createMockProduct({ id: 11, sellingPrice: 1000 });

    await addToCart(product); // qty=1, quantityBase=12
    await addToCart(product); // qty=2, quantityBase=24

    expect(cartItems.value).toHaveLength(1);
    expect(cartItems.value[0].quantity).toBe(2);
    expect(cartItems.value[0].quantityBase).toBe(24);
  });

  it('returns false and does not add when user cancels zero-price confirm', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

    const { cartItems, addToCart } = usePosCart();
    const product = createMockProduct({ id: 4, sellingPrice: 0 });

    const result = await addToCart(product);

    expect(result).toBe(false);
    expect(cartItems.value).toHaveLength(0);
  });

  it('adds zero-price item when user confirms', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

    const { cartItems, addToCart } = usePosCart();
    const product = createMockProduct({ id: 5, sellingPrice: 0 });

    const result = await addToCart(product);

    expect(result).toBe(true);
    expect(cartItems.value).toHaveLength(1);
  });
});

describe('usePosCart — increaseQuantity / decreaseQuantity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('increaseQuantity adds one to item quantity', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, increaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    increaseQuantity(0);

    expect(cartItems.value[0].quantity).toBe(2);
  });

  it('increaseQuantity updates quantityBase and subtotal', async () => {
    const { productsClient } = await import('@/api');
    const unit = createMockProductUnit({
      unitName: 'packet',
      sellingPrice: 1200,
      isDefault: true,
      isActive: true,
      factorToBase: 12,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([unit]));

    const { cartItems, addToCart, increaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 100 }));
    // qty=1, quantityBase=12, subtotal=1200

    increaseQuantity(0); // qty=2

    expect(cartItems.value[0].quantity).toBe(2);
    expect(cartItems.value[0].quantityBase).toBe(24); // 2 × 12
    expect(cartItems.value[0].subtotal).toBe(2400); // 2 × 1200
  });

  it('decreaseQuantity reduces quantity when above 1', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    increaseQuantity(0); // qty = 2

    decreaseQuantity(0); // qty = 1

    expect(cartItems.value[0].quantity).toBe(1);
  });

  it('decreaseQuantity updates quantityBase and subtotal', async () => {
    const { productsClient } = await import('@/api');
    const unit = createMockProductUnit({
      unitName: 'packet',
      sellingPrice: 1200,
      isDefault: true,
      isActive: true,
      factorToBase: 12,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([unit]));

    const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 100 }));
    increaseQuantity(0); // qty=2, quantityBase=24, subtotal=2400

    decreaseQuantity(0); // qty=1

    expect(cartItems.value[0].quantity).toBe(1);
    expect(cartItems.value[0].quantityBase).toBe(12); // 1 × 12
    expect(cartItems.value[0].subtotal).toBe(1200); // 1 × 1200
  });

  it('decreaseQuantity removes item when quantity reaches 1 (2-item cart)', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, decreaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    await addToCart(createMockProduct({ id: 2, sellingPrice: 2000 }));

    decreaseQuantity(0); // qty=1 → removes item at index 0

    expect(cartItems.value).toHaveLength(1);
    expect(cartItems.value[0].productId).toBe(2);
  });
});

describe('usePosCart — removeFromCart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes item and returns "removed" when cart has multiple items', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, removeFromCart } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    await addToCart(createMockProduct({ id: 2, sellingPrice: 2000 }));

    const result = removeFromCart(0);

    expect(result).toBe('removed');
    expect(cartItems.value).toHaveLength(1);
  });

  it('returns "confirm-needed" when removing the last item', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, removeFromCart } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    const result = removeFromCart(0);

    expect(result).toBe('confirm-needed');
    expect(cartItems.value).toHaveLength(1); // item stays
  });
});

describe('usePosCart — confirmRemoveAt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes item unconditionally even when it is the last one', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, confirmRemoveAt } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    confirmRemoveAt(0);

    expect(cartItems.value).toHaveLength(0);
  });
});

describe('usePosCart — subtotal and total', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('subtotal sums quantity * unitPrice across all items', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { subtotal, addToCart, increaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000, unit: 'pcs' }));
    await addToCart(createMockProduct({ id: 2, sellingPrice: 2000, unit: 'box' }));
    increaseQuantity(0); // item 0 qty=2 → 2000

    // 2 * 1000 + 1 * 2000 = 4000
    expect(subtotal.value).toBe(4000);
  });

  it('total = subtotal - discount + tax', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { total, discount, tax, addToCart } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 5000 }));

    discount.value = 500;
    tax.value = 250;

    expect(total.value).toBe(4750); // 5000 - 500 + 250
  });

  it('total is clamped to 0 (never negative)', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { total, discount, addToCart } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    discount.value = 9999; // more than subtotal

    expect(total.value).toBe(0);
  });
});

describe('usePosCart — applyDiscount', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets discount when within [0, subtotal]', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { discount, addToCart, applyDiscount } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 5000 }));

    applyDiscount(1000);

    expect(discount.value).toBe(1000);
  });

  it('ignores discount larger than subtotal', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { discount, addToCart, applyDiscount } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 5000 }));

    applyDiscount(9999); // too large
    expect(discount.value).toBe(0); // unchanged from initial
  });

  it('ignores negative discount', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { discount, addToCart, applyDiscount } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 5000 }));

    applyDiscount(-100);
    expect(discount.value).toBe(0);
  });
});

describe('usePosCart — handleUnitChange', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates unitName, unitFactor, unitPrice on unit change', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000, unit: 'pcs' }));

    const newUnit = createMockProductUnit({
      unitName: 'carton',
      factorToBase: 24,
      sellingPrice: 22000,
    });

    handleUnitChange({ index: 0, unit: newUnit });

    expect(cartItems.value[0].unitName).toBe('carton');
    expect(cartItems.value[0].unitFactor).toBe(24);
    expect(cartItems.value[0].unitPrice).toBe(22000);
    expect(cartItems.value[0].quantityBase).toBe(24); // 1 × 24
  });

  it('recalculates quantityBase correctly after unit change with multiple quantities', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, increaseQuantity, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000, unit: 'pcs' }));
    increaseQuantity(0); // qty=2

    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'packet', sellingPrice: 1200, factorToBase: 12 }),
    });

    // qty=2, factor=12 → quantityBase = 2 × 12 = 24
    expect(cartItems.value[0].quantityBase).toBe(24);
    expect(cartItems.value[0].subtotal).toBe(2400); // 2 × 1200
  });

  it('recalculates subtotal after unit change', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, increaseQuantity, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    increaseQuantity(0); // qty=2

    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'box', sellingPrice: 5000, factorToBase: 6 }),
    });

    // qty=2, price=5000 → subtotal=10000
    expect(cartItems.value[0].subtotal).toBe(10000);
  });

  it('does nothing for invalid index', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    // Should not throw
    handleUnitChange({
      index: 99,
      unit: createMockProductUnit({ unitName: 'invalid', sellingPrice: 9999, factorToBase: 1 }),
    });

    expect(cartItems.value[0].unitPrice).toBe(1000); // unchanged
  });
});

describe('usePosCart — resetCart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears all cart state', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, discount, tax, selectedCustomerId, saleNote, addToCart, resetCart } =
      usePosCart();

    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    discount.value = 100;
    tax.value = 50;
    selectedCustomerId.value = 5;
    saleNote.value = 'Test note';

    resetCart();

    expect(cartItems.value).toEqual([]);
    expect(discount.value).toBe(0);
    expect(tax.value).toBe(0);
    expect(selectedCustomerId.value).toBeNull();
    expect(saleNote.value).toBeNull();
  });
});

// ── Unit Change — price fallback and factor normalization ───────────────────

describe('usePosCart — handleUnitChange price fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to product base price when unit has null sellingPrice', async () => {
    const { productsClient } = await import('@/api');
    const boxUnit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 12000,
      factorToBase: 12,
      isDefault: true,
      isActive: true,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([boxUnit]));

    const { cartItems, addToCart, handleUnitChange } = usePosCart();
    // Product base price = 1000
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    // Cart item starts at box price (12000)
    expect(cartItems.value[0].unitPrice).toBe(12000);

    // Switch to a unit with null sellingPrice → should use product base price (1000), NOT box price (12000)
    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'piece', sellingPrice: null, factorToBase: 1 }),
    });

    expect(cartItems.value[0].unitPrice).toBe(1000);
    expect(cartItems.value[0].unitName).toBe('piece');
  });

  it('falls back to product base price when unit has undefined sellingPrice', async () => {
    const { productsClient } = await import('@/api');
    const boxUnit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 5000,
      factorToBase: 6,
      isDefault: true,
      isActive: true,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([boxUnit]));

    const { cartItems, addToCart, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 2, sellingPrice: 800 }));

    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'piece', sellingPrice: undefined, factorToBase: 1 }),
    });

    expect(cartItems.value[0].unitPrice).toBe(800);
  });

  it('preserves product base price across multiple unit switches', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 3, sellingPrice: 500, unit: 'pcs' }));
    // base price→500, unit price→500

    // Switch to carton (price=6000, factor=12)
    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'carton', sellingPrice: 6000, factorToBase: 12 }),
    });
    expect(cartItems.value[0].unitPrice).toBe(6000);

    // Switch to pack (price=2500, factor=6)
    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'pack', sellingPrice: 2500, factorToBase: 6 }),
    });
    expect(cartItems.value[0].unitPrice).toBe(2500);

    // Switch to unit with NO price → should fall back to base (500), not pack (2500)
    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'piece', sellingPrice: null, factorToBase: 1 }),
    });
    expect(cartItems.value[0].unitPrice).toBe(500);
  });
});

describe('usePosCart — handleUnitChange factor normalization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes undefined factorToBase to 1', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, handleUnitChange } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({
        unitName: 'piece',
        sellingPrice: 1000,
        factorToBase: undefined,
      }),
    });

    expect(cartItems.value[0].unitFactor).toBe(1);
    expect(cartItems.value[0].quantityBase).toBe(1);
  });

  it('stores normalized factor that persists through quantity changes', async () => {
    const { productsClient } = await import('@/api');
    const unit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 3000,
      isDefault: true,
      isActive: true,
      factorToBase: 6,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([unit]));

    const { cartItems, addToCart, handleUnitChange, increaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 500 }));

    // Change to unit with factor 24
    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'carton', sellingPrice: 12000, factorToBase: 24 }),
    });

    expect(cartItems.value[0].unitFactor).toBe(24);
    expect(cartItems.value[0].quantityBase).toBe(24); // 1 × 24

    // Increase quantity — factor should persist
    increaseQuantity(0);
    expect(cartItems.value[0].unitFactor).toBe(24);
    expect(cartItems.value[0].quantityBase).toBe(48); // 2 × 24
    expect(cartItems.value[0].subtotal).toBe(24000); // 2 × 12000
  });
});

// ── decreaseQuantity return values ──────────────────────────────────────────

describe('usePosCart — decreaseQuantity return status', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "decreased" when quantity is above 1', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { addToCart, increaseQuantity, decreaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    increaseQuantity(0); // qty=2

    const result = decreaseQuantity(0);
    expect(result).toBe('decreased');
  });

  it('returns "removed" when last item in multi-item cart reaches qty 1', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { addToCart, decreaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    await addToCart(createMockProduct({ id: 2, sellingPrice: 2000 }));

    const result = decreaseQuantity(0); // qty=1, multi-item → removes
    expect(result).toBe('removed');
  });

  it('returns "confirm-needed" when only item at qty 1', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, addToCart, decreaseQuantity } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    const result = decreaseQuantity(0);
    expect(result).toBe('confirm-needed');
    expect(cartItems.value).toHaveLength(1); // item stays
  });
});

// ── Cache management ────────────────────────────────────────────────────────

describe('usePosCart — clearUnitCache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forces fresh fetch after clearing cache for a specific product', async () => {
    const { productsClient } = await import('@/api');
    const unit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 5000,
      isDefault: true,
      isActive: true,
      factorToBase: 12,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([unit]));

    const { addToCart, clearUnitCache } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));

    expect(productsClient.getUnits).toHaveBeenCalledTimes(1);

    // Second add uses cache — no new API call
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    expect(productsClient.getUnits).toHaveBeenCalledTimes(1);

    // Clear cache → next add should refetch
    clearUnitCache(1);
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    expect(productsClient.getUnits).toHaveBeenCalledTimes(2);
  });

  it('clears all cached units when called without productId', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { addToCart, clearUnitCache } = usePosCart();
    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    await addToCart(createMockProduct({ id: 2, sellingPrice: 2000 }));
    expect(productsClient.getUnits).toHaveBeenCalledTimes(2);

    clearUnitCache(); // clear all

    await addToCart(createMockProduct({ id: 1, sellingPrice: 1000 }));
    await addToCart(createMockProduct({ id: 2, sellingPrice: 2000 }));
    expect(productsClient.getUnits).toHaveBeenCalledTimes(4);
  });
});

// ── trackProductPrice ───────────────────────────────────────────────────────

describe('usePosCart — trackProductPrice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows manual base price registration for held sale items', async () => {
    const { productsClient } = await import('@/api');
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([]));

    const { cartItems, handleUnitChange, trackProductPrice } = usePosCart();

    // Simulate a resumed held sale item
    cartItems.value.push({
      productId: 42,
      productName: 'Restored Item',
      quantity: 3,
      unitPrice: 6000,
      unitName: 'box',
      unitFactor: 12,
      quantityBase: 36,
      discount: 0,
      subtotal: 18000,
    });

    // Register the product's base price
    trackProductPrice(42, 500);

    // Now switching to a priceless unit should use the tracked base price
    handleUnitChange({
      index: 0,
      unit: createMockProductUnit({ unitName: 'piece', sellingPrice: null, factorToBase: 1 }),
    });

    expect(cartItems.value[0].unitPrice).toBe(500);
    expect(cartItems.value[0].unitFactor).toBe(1);
    expect(cartItems.value[0].quantityBase).toBe(3);
  });
});

// ── Full unit workflow scenarios ────────────────────────────────────────────

describe('usePosCart — full workflow scenarios', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('complete flow: add → change unit → increase → change unit → pay', async () => {
    const { productsClient } = await import('@/api');
    const pieceUnit = createMockProductUnit({
      unitName: 'piece',
      sellingPrice: 500,
      factorToBase: 1,
      isDefault: true,
      isActive: true,
    });
    const boxUnit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 5500,
      factorToBase: 12,
      isDefault: false,
      isActive: true,
    });
    vi.mocked(productsClient.getUnits).mockResolvedValue(createApiSuccess([pieceUnit, boxUnit]));

    const { cartItems, subtotal, addToCart, handleUnitChange, increaseQuantity } = usePosCart();

    // Step 1: Add product (default = piece, price=500, factor=1)
    await addToCart(createMockProduct({ id: 1, sellingPrice: 500 }));
    expect(cartItems.value[0].unitName).toBe('piece');
    expect(cartItems.value[0].unitPrice).toBe(500);
    expect(cartItems.value[0].quantityBase).toBe(1);

    // Step 2: Switch to box (price=5500, factor=12)
    handleUnitChange({ index: 0, unit: boxUnit });
    expect(cartItems.value[0].unitPrice).toBe(5500);
    expect(cartItems.value[0].unitFactor).toBe(12);
    expect(cartItems.value[0].quantityBase).toBe(12);
    expect(cartItems.value[0].subtotal).toBe(5500);

    // Step 3: Increase to 3 boxes
    increaseQuantity(0);
    increaseQuantity(0);
    expect(cartItems.value[0].quantity).toBe(3);
    expect(cartItems.value[0].quantityBase).toBe(36); // 3 × 12
    expect(cartItems.value[0].subtotal).toBe(16500); // 3 × 5500

    // Step 4: Switch back to piece (price=500, factor=1)
    handleUnitChange({ index: 0, unit: pieceUnit });
    expect(cartItems.value[0].unitPrice).toBe(500);
    expect(cartItems.value[0].unitFactor).toBe(1);
    expect(cartItems.value[0].quantityBase).toBe(3); // 3 × 1
    expect(cartItems.value[0].subtotal).toBe(1500); // 3 × 500

    // Step 5: Verify subtotal reflects all items
    expect(subtotal.value).toBe(1500);
  });

  it('multiple products with different units in same cart', async () => {
    const { productsClient } = await import('@/api');
    // Product A has box unit
    const boxUnit = createMockProductUnit({
      unitName: 'box',
      sellingPrice: 6000,
      factorToBase: 12,
      isDefault: true,
      isActive: true,
    });
    // Product B has no units
    vi.mocked(productsClient.getUnits)
      .mockResolvedValueOnce(createApiSuccess([boxUnit]))
      .mockResolvedValueOnce(createApiSuccess([]));

    const { cartItems, subtotal, addToCart, increaseQuantity } = usePosCart();

    await addToCart(createMockProduct({ id: 1, name: 'Water', sellingPrice: 500 }));
    await addToCart(createMockProduct({ id: 2, name: 'Chips', sellingPrice: 250 }));

    // Water: 1 box @ 6000, quantityBase=12
    expect(cartItems.value[0].unitPrice).toBe(6000);
    expect(cartItems.value[0].quantityBase).toBe(12);

    // Chips: 1 piece @ 250, quantityBase=1
    expect(cartItems.value[1].unitPrice).toBe(250);
    expect(cartItems.value[1].quantityBase).toBe(1);

    increaseQuantity(0); // 2 boxes of water

    // Total: 2×6000 + 1×250 = 12250
    expect(subtotal.value).toBe(12250);
    expect(cartItems.value[0].quantityBase).toBe(24); // 2 × 12
  });
});
