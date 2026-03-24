import { computed, type ComputedRef, type Ref } from 'vue';
import type { PaymentMethod } from '@/types/domain';
import { safeParseAmount } from '@/components/pos/safeParseAmount';

interface UsePaymentSettlementOptions {
  total: ComputedRef<number>;
  subtotal: ComputedRef<number | undefined>;
  discount: ComputedRef<number>;
  tax: ComputedRef<number>;
  amountInput: Ref<string>;
  extraDiscountInput: Ref<string>;
  selectedPaymentMethod: Ref<PaymentMethod>;
  referenceNumber: Ref<string>;
  busy: ComputedRef<boolean>;
  allowPartial: ComputedRef<boolean>;
  hasCustomer: ComputedRef<boolean>;
}

export function usePaymentSettlement(options: UsePaymentSettlementOptions) {
  const baseDiscount = computed(() => Math.max(0, options.discount.value));

  const subtotalValue = computed(() => {
    if (typeof options.subtotal.value === 'number') {
      return Math.max(0, options.subtotal.value);
    }
    return Math.max(0, options.total.value + baseDiscount.value - Math.max(0, options.tax.value));
  });

  const extraDiscount = computed(() => {
    const parsed = safeParseAmount(options.extraDiscountInput.value);
    return Math.min(parsed, subtotalValue.value);
  });

  const appliedDiscount = computed(() => {
    return Math.min(baseDiscount.value + extraDiscount.value, subtotalValue.value);
  });

  const effectiveTotal = computed(() => {
    if (typeof options.subtotal.value === 'number') {
      return Math.max(
        0,
        subtotalValue.value - appliedDiscount.value + Math.max(0, options.tax.value)
      );
    }
    return Math.max(0, options.total.value - extraDiscount.value);
  });

  const paidAmount = computed(() => safeParseAmount(options.amountInput.value));
  const remainingAmount = computed(() => Math.max(effectiveTotal.value - paidAmount.value, 0));
  const changeAmount = computed(() => Math.max(paidAmount.value - effectiveTotal.value, 0));

  const settlementLabel = computed(() => (changeAmount.value > 0 ? 'الباقي/الراجع' : 'متبقي'));
  const settlementValue = computed(() =>
    changeAmount.value > 0 ? changeAmount.value : remainingAmount.value
  );

  const settlementValueClass = computed(() => {
    if (changeAmount.value > 0) return 'text-success';
    if (remainingAmount.value > 0) return 'text-error';
    return '';
  });

  const canConfirm = computed(() => {
    if (options.busy.value || effectiveTotal.value <= 0) return false;
    if (options.selectedPaymentMethod.value === 'card' && !options.referenceNumber.value.trim()) {
      return false;
    }
    if (options.selectedPaymentMethod.value === 'credit' && !options.hasCustomer.value) {
      return false;
    }
    if (options.selectedPaymentMethod.value === 'credit') {
      return paidAmount.value <= effectiveTotal.value;
    }
    if (options.allowPartial.value) return paidAmount.value > 0;
    return paidAmount.value >= effectiveTotal.value;
  });

  return {
    baseDiscount,
    subtotalValue,
    appliedDiscount,
    effectiveTotal,
    paidAmount,
    remainingAmount,
    changeAmount,
    settlementLabel,
    settlementValue,
    settlementValueClass,
    canConfirm,
  };
}
