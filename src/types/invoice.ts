/**
 * Unified invoice financial state — the SINGLE source of truth for invoice
 * financial data in the UI.
 *
 * This type matches the mandatory backend contract exactly.
 * All invoice financial display must go through this model; never derive
 * alternative meanings or override fields.
 *
 * Mapping helpers convert backend Sale/Purchase DTOs into this model so that
 * components never need to know about field-name differences between the two
 * domain objects.
 */

import type { Sale, Purchase } from './domain';

// ── Contract type ────────────────────────────────────────────────────────────

export interface InvoiceFinancialState {
  id: number;
  invoiceNumber: string;
  /** Invoice total amount (sale: total, purchase: total) */
  totalAmount: number;
  /** Amount already paid against this invoice only — NOT ledger balance */
  paidAmount: number;
  /** Amount still owed on this invoice — NOT customer balance */
  remainingAmount: number;
  /** Backend-authoritative payment status — never derive this in the UI */
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  /** Invoice lifecycle status (operational state) */
  status: string;
  /** Present for sales invoices */
  customerId?: number;
  /** Present for purchase invoices */
  supplierId?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

/**
 * Map a backend Sale DTO → InvoiceFinancialState.
 * Use backend paymentStatus when present; fall back only if the field is
 * absent (i.e. the backend hasn't been updated yet).
 */
export function saleToInvoiceFinancialState(sale: Sale): InvoiceFinancialState {
  const paidAmount = sale.paidAmount ?? 0;
  const remainingAmount = sale.remainingAmount ?? 0;

  return {
    id: sale.id!,
    invoiceNumber: sale.invoiceNumber,
    totalAmount: sale.total,
    paidAmount,
    remainingAmount,
    paymentStatus:
      sale.paymentStatus ?? derivePaymentStatus(paidAmount, sale.total, remainingAmount),
    status: sale.status ?? 'pending',
    customerId: sale.customerId ?? undefined,
    createdAt: sale.createdAt ?? '',
    updatedAt: sale.updatedAt ?? '',
  };
}

/**
 * Map a backend Purchase DTO → InvoiceFinancialState.
 */
export function purchaseToInvoiceFinancialState(purchase: Purchase): InvoiceFinancialState {
  const paidAmount = purchase.paidAmount ?? 0;
  const remainingAmount = purchase.remainingAmount ?? 0;

  return {
    id: purchase.id!,
    invoiceNumber: purchase.invoiceNumber,
    totalAmount: purchase.total,
    paidAmount,
    remainingAmount,
    paymentStatus:
      purchase.paymentStatus ?? derivePaymentStatus(paidAmount, purchase.total, remainingAmount),
    status: purchase.status ?? 'pending',
    supplierId: purchase.supplierId,
    createdAt: purchase.createdAt ?? '',
    updatedAt: purchase.updatedAt ?? '',
  };
}

// ── Fallback helper ───────────────────────────────────────────────────────────
// Only used when the backend does not yet return paymentStatus.
// This must mirror backend logic exactly — do not add custom rules.

function derivePaymentStatus(
  paid: number,
  total: number,
  remaining: number
): 'unpaid' | 'partial' | 'paid' {
  if (remaining <= 0 && paid >= total) return 'paid';
  if (paid > 0 && remaining > 0) return 'partial';
  return 'unpaid';
}

// ── Display helpers ──────────────────────────────────────────────────────────

/** Human-readable Arabic label for paymentStatus */
export function paymentStatusLabel(status: InvoiceFinancialState['paymentStatus']): string {
  switch (status) {
    case 'paid':
      return 'مدفوع';
    case 'partial':
      return 'مدفوع جزئياً';
    case 'unpaid':
      return 'غير مدفوع';
  }
}

/** Vuetify color token for paymentStatus chip */
export function paymentStatusColor(status: InvoiceFinancialState['paymentStatus']): string {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'unpaid':
      return 'error';
  }
}
