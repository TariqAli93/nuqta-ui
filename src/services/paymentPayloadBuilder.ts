import type { PaymentMethod, SaleInput } from '@/types/domain';
import type { ConfirmedPaymentPayload } from '@/types/payment.types';

interface PaymentPayloadBuilderInput {
  paid: number;
  paymentType: SaleInput['paymentType'];
  currency: string;
  paymentMethod: PaymentMethod;
  appliedDiscount: number;
  baseDiscount: number;
  referenceNumber: string;
}

export function buildPaymentPayload(input: PaymentPayloadBuilderInput): ConfirmedPaymentPayload {
  const payload: ConfirmedPaymentPayload = {
    paid: input.paid,
    paymentType: input.paymentType,
    currency: input.currency,
    paymentMethod: input.paymentMethod,
  };

  if (input.appliedDiscount !== input.baseDiscount) {
    payload.discount = input.appliedDiscount;
  }

  if (input.paymentMethod === 'card' && input.referenceNumber.trim()) {
    payload.referenceNumber = input.referenceNumber.trim();
  }

  return payload;
}
