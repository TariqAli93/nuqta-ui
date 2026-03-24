import type { PaymentMethodOption, PaymentKeypadKey } from '@/types/payment.types';

export const paymentKeypadKeys: PaymentKeypadKey[] = [
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '5', label: '5' },
  { id: '6', label: '6' },
  { id: '7', label: '7' },
  { id: '8', label: '8' },
  { id: '9', label: '9' },
  { id: '00', label: '00' },
  { id: '0', label: '0' },
  { id: 'backspace', label: '⌫' },
];

export const paymentMethodOptions: PaymentMethodOption[] = [
  { label: 'نقدي', value: 'cash' },
  { label: 'بطاقة', value: 'card' },
  { label: 'آجل', value: 'credit' },
  { label: 'حوالة', value: 'bank_transfer' },
];
