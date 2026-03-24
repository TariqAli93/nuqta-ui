import { computed, ref, watch, type ComputedRef } from 'vue';
import type { PaymentMethod } from '@/types/domain';
import type { PaymentActiveField } from '@/types/payment.types';
import { notifyWarn } from '@/utils/notify';
import { paymentKeypadKeys, paymentMethodOptions } from './paymentEntry.constants';
import { stripNonDigits, toInputAmount } from './paymentEntry.utils';

interface UsePaymentEntryOptions {
  busy: ComputedRef<boolean>;
  hasCustomer: ComputedRef<boolean>;
}

export function usePaymentEntry(options: UsePaymentEntryOptions) {
  const amountInput = ref('');
  const extraDiscountInput = ref('');
  const selectedPaymentMethod = ref<PaymentMethod>('cash');
  const referenceNumber = ref('');
  const discountEditorOpen = ref(false);

  const activeField = ref<PaymentActiveField>(null);
  const isRewriteMode = ref(true);
  const entryMode = ref<'int' | 'dec'>('int');

  const keypadKeys = paymentKeypadKeys;

  const selectedMethodLabel = computed(() => {
    if (selectedPaymentMethod.value === 'card') return 'بطاقة';
    if (selectedPaymentMethod.value === 'credit') return 'آجل';
    if (selectedPaymentMethod.value === 'bank_transfer') return 'حوالة';
    return 'نقدي';
  });

  watch(
    () => [selectedPaymentMethod.value, options.hasCustomer.value],
    ([method, hasCustomer]) => {
      if (method !== 'credit' || hasCustomer) return;
      notifyWarn('يجب ربط زبون لاستخدام الدفع الآجل', {
        dedupeKey: 'pos-credit-needs-customer',
      });
    }
  );

  function setActiveField(field: Exclude<PaymentActiveField, null>) {
    activeField.value = field;
    if (field === 'amount') isRewriteMode.value = false;
  }

  function clearActiveField(field?: Exclude<PaymentActiveField, null>) {
    if (!field || activeField.value === field) activeField.value = null;
  }

  function onAmountInput(value: string) {
    amountInput.value = stripNonDigits(value || '');
    isRewriteMode.value = false;
    entryMode.value = amountInput.value.includes('.') ? 'dec' : 'int';
  }

  function onExtraDiscountInput(value: string) {
    extraDiscountInput.value = stripNonDigits(value || '');
  }

  function appendNumericTo(model: { value: string }, char: string) {
    if (options.busy.value) return;
    if (!/^\d$/.test(char) && char !== '.') return;

    const current = model.value ?? '';
    if (char === '.') {
      if (current.includes('.')) return;
      model.value = current === '' ? '0.' : current + '.';
      return;
    }

    if (current === '') {
      model.value = char;
      return;
    }

    if (current === '0' && !current.includes('.')) {
      model.value = char;
      return;
    }

    model.value = current + char;
  }

  function appendDigitsOnlyTo(model: { value: string }, char: string) {
    if (options.busy.value) return;
    if (!/^\d$/.test(char)) return;
    model.value = (model.value ?? '') + char;
  }

  function appendAmount(char: string) {
    if (options.busy.value) return;
    if (!/^\d$/.test(char) && char !== '00') return;

    if (isRewriteMode.value) {
      amountInput.value = '';
      isRewriteMode.value = false;
      entryMode.value = 'int';
    }

    const current = amountInput.value ?? '';
    if (char === '00') {
      if (current === '' || current === '0') {
        amountInput.value = '0';
        return;
      }
      amountInput.value = current + '00';
      return;
    }

    if (current === '') {
      amountInput.value = char;
      return;
    }

    if (entryMode.value === 'int' && current === '0' && !current.includes('.')) {
      amountInput.value = char;
      return;
    }

    const dotIndex = current.indexOf('.');
    if (dotIndex >= 0 && entryMode.value === 'int') {
      const intPart = current.slice(0, dotIndex);
      const decPart = current.slice(dotIndex);
      amountInput.value = (intPart === '0' ? char : intPart + char) + decPart;
      return;
    }

    amountInput.value = current + char;
  }

  function backspaceModel(model: { value: string }) {
    if (options.busy.value) return;
    const cur = model.value ?? '';
    if (!cur) return;
    model.value = cur.slice(0, -1);
  }

  function backspaceAmount() {
    if (options.busy.value) return;
    const cur = amountInput.value;
    if (!cur) return;

    isRewriteMode.value = false;
    amountInput.value = cur.slice(0, -1);
    entryMode.value = amountInput.value.includes('.') ? entryMode.value : 'int';
  }

  function clearModel(model: { value: string }) {
    if (options.busy.value) return;
    model.value = '';
  }

  function clearAmount() {
    if (options.busy.value) return;
    amountInput.value = '';
    isRewriteMode.value = false;
    entryMode.value = 'int';
  }

  function fillExact(total: number) {
    if (options.busy.value) return;
    amountInput.value = toInputAmount(total);
    isRewriteMode.value = true;
    entryMode.value = 'int';
  }

  function toggleDiscountEditor() {
    if (options.busy.value) return;
    discountEditorOpen.value = !discountEditorOpen.value;
    if (!discountEditorOpen.value) extraDiscountInput.value = '';
  }

  function clearActiveValue() {
    const field = activeField.value ?? 'amount';
    if (field === 'amount') clearAmount();
    else if (field === 'discount') clearModel(extraDiscountInput);
    else clearModel(referenceNumber);
  }

  function handleKeypadPress(key: string) {
    const field = activeField.value ?? 'amount';

    if (key === 'backspace') {
      if (field === 'amount') backspaceAmount();
      else if (field === 'discount') backspaceModel(extraDiscountInput);
      else backspaceModel(referenceNumber);
      return;
    }

    if (field === 'amount') {
      appendAmount(key);
      return;
    }

    if (field === 'discount') {
      appendNumericTo(extraDiscountInput, key);
      return;
    }

    appendDigitsOnlyTo(referenceNumber, key);
  }

  function resetEntry(initialAmount: number) {
    selectedPaymentMethod.value = 'cash';
    referenceNumber.value = '';
    discountEditorOpen.value = false;
    extraDiscountInput.value = '';
    amountInput.value = toInputAmount(initialAmount);
    isRewriteMode.value = true;
    entryMode.value = 'int';
    activeField.value = null;
  }

  return {
    amountInput,
    extraDiscountInput,
    selectedPaymentMethod,
    referenceNumber,
    discountEditorOpen,
    activeField,
    keypadKeys,
    paymentMethodOptions,
    selectedMethodLabel,
    setActiveField,
    clearActiveField,
    onAmountInput,
    onExtraDiscountInput,
    clearAmount,
    clearActiveValue,
    fillExact,
    toggleDiscountEditor,
    handleKeypadPress,
    resetEntry,
  };
}
