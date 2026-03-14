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

    const {
      cartItems, discount, tax, selectedCustomerId, saleNote,
      addToCart, resetCart,
    } = usePosCart();

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
