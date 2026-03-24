/**
 * posCheckoutService — pure helpers for building a sale payload.
 * No Vue refs. No side effects. Accepts plain values, returns plain objects.
 */
import type { PaymentMethod, SaleInput, SaleItem } from '@/types/domain';
import { generateIdempotencyKey } from '@/utils/idempotency';

export interface CheckoutParams {
  cartItems: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  currency: string;
  customerId: number | null;
  saleNote: string | null;
  paidAmount: number;
  paymentType: SaleInput['paymentType'];
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  error?: string;
  payableTotal: number;
}

/**
 * Validate that the payment amounts are coherent before submitting.
 */
export function validatePayment(
  subtotal: number,
  discount: number,
  tax: number,
  paidAmount: number,
  paymentType: SaleInput['paymentType']
): PaymentValidationResult {
  const appliedDiscount = Math.min(Math.max(discount, 0), subtotal);
  const payableTotal = Math.max(0, subtotal - appliedDiscount + tax);
  const paid = Math.max(paidAmount, 0);

  if (payableTotal <= 0) {
    return { valid: false, error: 'إجمالي المستحق يجب أن يكون أكبر من صفر', payableTotal };
  }

  // Credit sales allow partial or zero upfront payment.
  if (paymentType === 'credit') {
    if (paid > payableTotal) {
      return {
        valid: false,
        error: 'المبلغ المدفوع لا يمكن أن يتجاوز إجمالي المستحق',
        payableTotal,
      };
    }
    return { valid: true, payableTotal };
  }

  if (paid < payableTotal) {
    return { valid: false, error: 'المبلغ المدفوع أقل من إجمالي المستحق', payableTotal };
  }

  return { valid: true, payableTotal };
}

/**
 * Assemble the complete SaleInput payload ready for the API.
 */
export function buildSalePayload(params: CheckoutParams): SaleInput {
  const appliedDiscount = Math.min(Math.max(params.discount, 0), params.subtotal);
  const payableTotal = Math.max(0, params.subtotal - appliedDiscount + params.tax);
  const paid = Math.max(params.paidAmount, 0);
  const remainingAmount = Math.max(payableTotal - paid, 0);

  const itemsWithSubtotals = params.cartItems.map((item) => ({
    ...item,
    subtotal: item.quantity * item.unitPrice - (item.discount || 0),
    quantityBase: item.quantity * (item.unitFactor ?? 1),
  }));

  return {
    invoiceNumber: `فاتورة-${Date.now()}`,
    customerId: params.customerId,
    subtotal: params.subtotal,
    discount: appliedDiscount,
    tax: params.tax,
    total: payableTotal,
    currency: params.currency,
    exchangeRate: 1,
    interestRate: 0,
    interestAmount: 0,
    paymentType: params.paymentType as SaleInput['paymentType'],
    paidAmount: paid,
    remainingAmount,
    status: remainingAmount <= 0 ? 'completed' : 'pending',
    notes: params.saleNote,
    items: itemsWithSubtotals,
    paymentMethod: params.paymentMethod,
    referenceNumber: params.referenceNumber,
    idempotencyKey: generateIdempotencyKey('sale'),
  };
}
