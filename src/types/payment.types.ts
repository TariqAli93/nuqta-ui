import type { PaymentMethod, SaleInput } from '@/types/domain';

export interface ConfirmedPaymentPayload {
  paid: number;
  paymentType: SaleInput['paymentType'];
  currency: string;
  discount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
}

export interface PaymentDialogProps {
  modelValue: boolean;
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  currency?: string;
  cashierName?: string;
  cashierTitle?: string;
  busy?: boolean;
  allowPartial?: boolean;
  hasCustomer?: boolean;
}

export type PaymentActiveField = 'amount' | 'discount' | 'reference' | null;

export interface PaymentKeypadKey {
  id: string;
  label: string;
}

export interface PaymentMethodOption {
  label: string;
  value: PaymentMethod;
}
