/**
 * Shared inventory display helpers.
 * Extracted from FinanceInventoryWorkspaceView to avoid duplicating
 * movement-label / color logic across views.
 */

export function useInventoryHelpers() {
  function movementLabel(value: string): string {
    if (value === 'in') return 'دخول';
    if (value === 'out') return 'خروج';
    if (value === 'adjust') return 'تعديل';
    if (value === 'transfer') return 'نقل';
    if (value === 'return') return 'إرجاع';
    if (value === 'cancellation') return 'إلغاء';
    return value;
  }

  function movementColor(value: string): string {
    if (value === 'in') return 'success';
    if (value === 'out') return 'error';
    if (value === 'adjust') return 'warning';
    return 'default';
  }

  function movementSignedPrefix(value: string): string {
    if (value === 'in') return '+';
    if (value === 'out') return '-';
    return '';
  }

  function movementSignedClass(value: string): string {
    if (value === 'in') return 'text-success';
    if (value === 'out') return 'text-error';
    return '';
  }

  function reasonLabel(value: string): string {
    if (value === 'manual') return 'تعديل يدوي';
    if (value === 'damage') return 'تالف';
    if (value === 'opening') return 'رصيد افتتاحي';
    if (value === 'sale') return 'بيع';
    if (value === 'purchase') return 'شراء';
    if (value === 'return') return 'إرجاع';
    if (value === 'refund') return 'استرجاع';
    if (value === 'adjustment') return 'تعديل';
    if (value === 'sale_cancellation') return 'إلغاء بيع';
    if (value === 'cancellation') return 'إلغاء فاتورة';
    if (value === 'transfer') return 'نقل';
    return value;
  }

  function reasonSignedColor(reason: string): string {
    if (reason === 'manual') return 'warning';
    if (reason === 'damage') return 'error';
    if (reason === 'opening') return 'info';
    if (reason === 'sale') return 'primary';
    if (reason === 'purchase') return 'success';
    if (reason === 'return') return 'error';
    if (reason === 'adjustment') return 'warning';
    if (reason === 'sale_cancellation') return 'info';
    if (reason === 'cancellation') return 'info';
    if (reason === 'transfer') return 'info';
    return '';
  }

  return {
    movementLabel,
    movementColor,
    movementSignedPrefix,
    movementSignedClass,
    reasonLabel,
    reasonSignedColor,
  };
}
