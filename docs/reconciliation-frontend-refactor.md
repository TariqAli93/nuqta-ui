# ERP Reconciliation Frontend Refactor (Vue 3 + TypeScript + Pinia + Vuetify)

## 1) Frontend architecture

### Module boundaries

```text
src/
  modules/accounting/reconciliation/
    pages/
      CustomerLedgerPage.vue
      SupplierLedgerPage.vue
      InvoiceDetailsPage.vue
      PaymentDetailsPage.vue
      ReconciliationWorkspacePage.vue
      ReconciliationHistoryPage.vue
    components/
      ledger/
        LedgerSummaryCards.vue
        LedgerFilters.vue
        LedgerTable.vue
        LedgerRowActions.vue
      reconciliation/
        ReconciliationCandidateTable.vue
        ReconciliationSelectionTable.vue
        ReconciliationTotalsPanel.vue
        ReconciliationPreviewDialog.vue
        UnreconcileDialog.vue
        ReconciliationHistoryTable.vue
      status/
        InvoiceStatusBadge.vue
        PaymentStatusBadge.vue
        ReconciliationStateChip.vue
    stores/
      useLedgerStore.ts
      useReconciliationStore.ts
      useReconciliationHistoryStore.ts
      useAccountingRefreshStore.ts
    services/
      reconciliationApi.ts
      ledgerApi.ts
      invoiceApi.ts
      paymentApi.ts
      mappers.ts
    composables/
      useReconciliationSelection.ts
      useReconciliationPreview.ts
      useStatusComputation.ts
      useAccountingErrorHandling.ts
      useRefreshOrchestration.ts
    utils/
      money.ts
      reconciliationValidation.ts
      statusRules.ts
      diff.ts
      lineGrouping.ts
    types/
      reconciliation.ts
      ledger.ts
      status.ts
```

### Responsibilities

- **Pages**: route-level orchestration, query params, screen layout, permission gating.
- **Components**: reusable UI blocks; no accounting truth logic except display-only formatting.
- **Stores (Pinia)**:
  - `useLedgerStore`: customer/supplier ledger line retrieval and normalized cache.
  - `useReconciliationStore`: candidate lines, selection, partial amounts, preview, submit state.
  - `useReconciliationHistoryStore`: paginated reconciliation records + filtering.
  - `useAccountingRefreshStore`: cross-screen refresh events keyed by entity/account/reconciliation id.
- **Services**: HTTP calls + response mapping + DTO normalization.
- **Composables**: business workflow composition (validation, preview, submit sequence).
- **Utils**: pure deterministic helpers (money precision, status calculation, validators).
- **Types/models**: single source of TS contracts used by stores/components/services.

### Architectural principles

1. **Journal line is atomic truth**: all statuses and balances computed from `JournalEntryLine` + reconciliation allocations.
2. **No document-level assumptions**: invoice/payment entities are metadata wrappers around lines.
3. **Pure computation layer**: status functions are side-effect free and testable.
4. **Store is state truth; UI local state is ephemeral only**.
5. **Refresh orchestration is event-driven after reconcile/unreconcile**.

---

## 2) Data contracts (TypeScript)

```ts
export type Money = string; // decimal serialized string to avoid float drift
export type CurrencyCode = string;

export type EntrySide = 'DEBIT' | 'CREDIT';
export type PartyType = 'CUSTOMER' | 'SUPPLIER';
export type SourceDocType = 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'JOURNAL' | 'UNKNOWN';

export interface JournalEntryLine {
  id: number;
  journalEntryId: number;
  lineNo: number;
  postingDate: string; // ISO date
  accountId: number;
  accountCode: string;
  accountName: string;
  partyType?: PartyType;
  partyId?: number;
  sourceDocType: SourceDocType;
  sourceDocId?: number;
  sourceDocNo?: string;
  description?: string;
  currency: CurrencyCode;
  debit: Money;           // line amount on debit side
  credit: Money;          // line amount on credit side
  openAmount: Money;      // backend-calculated remaining amount on natural side
  reconciledAmount: Money;
  isFullyReconciled: boolean;
  reconciliationVersion: number; // for optimistic concurrency checks
  createdAt: string;
  updatedAt: string;
}

export interface Reconciliation {
  id: number;
  reconciliationNo: string;
  postingDate: string;
  currency: CurrencyCode;
  totalAmount: Money;
  status: 'POSTED' | 'REVERSED';
  reason?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  reversedBy?: number;
  reversedAt?: string;
  reversalReason?: string;
  lines: ReconciliationLine[];
}

export interface ReconciliationLine {
  id: number;
  reconciliationId: number;
  journalEntryLineId: number;
  sourceDocType: SourceDocType;
  sourceDocId?: number;
  side: EntrySide;
  amount: Money;
  currency: CurrencyCode;
}

export interface LedgerRow {
  line: JournalEntryLine;
  signedAmount: Money;      // debit-credit or credit-debit normalized per view
  appliedAmount: Money;     // sum of reconciled allocations
  residualAmount: Money;    // openAmount
  runningBalance: Money;
  reconciledState: 'OPEN' | 'PARTIAL' | 'FULL';
  documentLabel: string;
}

export type InvoiceStatus =
  | 'OPEN'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERPAID';

export interface InvoiceStatusView {
  invoiceId: number;
  invoiceNo: string;
  currency: CurrencyCode;
  invoiceAmount: Money;
  appliedAmount: Money;
  residualAmount: Money;
  status: InvoiceStatus;
  reconciledLineIds: number[];
  asOf: string;
}

export type PaymentStatus =
  | 'UNRECONCILED_PAYMENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'UNAPPLIED_CREDIT'
  | 'OVERPAID';

export interface PaymentStatusView {
  paymentId: number;
  paymentNo: string;
  currency: CurrencyCode;
  paymentAmount: Money;
  allocatedAmount: Money;
  unappliedAmount: Money;
  status: PaymentStatus;
  allocatedInvoiceIds: number[];
  asOf: string;
}

export interface ReconciliationPreview {
  currency: CurrencyCode;
  debitTotal: Money;
  creditTotal: Money;
  difference: Money;
  isBalanced: boolean;
  isPartial: boolean;
  allocations: Array<{
    journalLineId: number;
    side: EntrySide;
    selectedAmount: Money;
    availableOpenAmount: Money;
    resultingOpenAmount: Money;
  }>;
  warnings: string[];
}

export interface ReconciliationRequest {
  journalLineIds: number[];
  amounts: Money[]; // same index as journalLineIds
  expectedVersions?: Array<{ journalLineId: number; reconciliationVersion: number }>;
}

export interface UnreconciliationRequest {
  reconciliationId: number;
  reason: string;
  expectedVersion?: number;
}
```

---

## 3) Screen redesigns

## A. Customer Ledger Page
- **Purpose**: AR line-level truth for a single customer; reconcile from outstanding receivable/payable lines.
- **Data source**: `GET /customers/:id/ledger`.
- **Columns**:
  - Date, JE No, Doc Type, Doc No, Description, Debit, Credit, Applied, Open, Running Balance, Reconcile State, Last Reconciled At.
- **Summary cards**:
  - Total debit, total credit, open receivable, unapplied credits, overdue open (if due dates available).
- **Filters**:
  - date range, doc type, open-only toggle, reconciled state, amount range, currency.
- **Row actions**:
  - Open document, add to reconciliation selection, view reconciliation trail, unreconcile (if authorized).
- **Validation**:
  - cannot select fully reconciled line; currency must match current selection; party must match.
- **Empty state**:
  - no ledger activity vs no filtered results differentiated.
- **Loading**:
  - skeleton table + disabled actions.
- **Error**:
  - retry panel + API error code/details.

## B. Supplier Ledger Page
Same as customer ledger, but AP-oriented cards:
- open payable, supplier advances, unapplied debit (prepayments).

## C. Invoice Details Page
- **Purpose**: invoice posting lines + reconciliation-derived payment lifecycle.
- **Data source**: invoice endpoint + related journal lines + reconciliation history for line ids.
- **Columns**:
  - Journal line ID, account, side, original amount, applied amount, open amount, state.
- **Summary cards**:
  - invoice amount, applied, residual, status badge (`OPEN/PARTIALLY_PAID/PAID/OVERPAID`).
- **Filters**:
  - open-only line toggle, date range for applied reconciliations.
- **Actions**:
  - open reconciliation workspace prefiltered to invoice line.
- **Validation**:
  - invoice status must always come from lines, never invoice flags.
- **States**:
  - standard empty/loading/error with stale-data banner when version mismatch.

## D. Payment Details Page
- **Purpose**: show allocation graph from payment lines to invoice lines.
- **Data source**: payment lines + reconciliation history.
- **Columns**:
  - line id, side, payment amount, allocated, unapplied, linked docs count.
- **Summary cards**:
  - payment total, allocated total, unapplied remainder, status badge.
- **Filters**:
  - allocated/unallocated, applied date range.
- **Actions**:
  - apply in reconciliation workspace, view/unreconcile allocations.

## E. Reconciliation Workspace
- **Purpose**: accountant cockpit for manual and assisted matching.
- **Data source**:
  - candidate lines from ledger APIs (or search endpoint if available), existing reconciliation data.
- **Layout**:
  - left: candidate list; right: selected lines + editable partial amounts; bottom: totals + difference + preview.
- **Columns (candidate)**:
  - checkbox, line id, date, party, doc, side, open amount, days outstanding, suggested match score.
- **Columns (selected)**:
  - line, side, open amount, selected amount (editable), resulting open.
- **Summary cards**:
  - selected debit total, selected credit total, difference.
- **Filters**:
  - party, currency, side, open-only, date, amount, doc type.
- **Actions**:
  - auto-suggest, clear selection, preview, reconcile, save filter preset.
- **Validation**:
  - same party scope (unless inter-party allowed), same currency, at least one debit + one credit, amount <= open.
- **Empty/loading/error**:
  - explicit hints for broadening filters; loading shimmer; recoverable validation and server errors.

## F. Reconciliation History Page
- **Purpose**: audit-safe reconciliation timeline.
- **Data source**: `GET /accounting/reconciliations`.
- **Columns**:
  - rec no, date, party, currency, amount, line count, status, created by, reversed by, actions.
- **Summary cards**:
  - today reconciled amount, unreconciled count, reversed amount.
- **Filters**:
  - date range, status, party, creator, amount band.
- **Actions**:
  - open details drawer, unreconcile (with reason), jump to affected invoice/payment.
- **Validation**:
  - prevent unreconcile if already reversed.

---

## 4) Reconciliation UI behavior

1. **Selecting candidates**
   - add candidate by checkbox/action.
   - auto-fill selected amount = min(openAmount, remaining opposite side shortfall) for suggested mode.

2. **Compatibility validation**
   - must share currency.
   - must include both debit and credit sides.
   - selected amount > 0 and <= line openAmount.
   - reject `isFullyReconciled` lines.
   - optional: enforce same party/account control account.

3. **Totals and difference**
   - `debitTotal = sum(selected debit amounts)`
   - `creditTotal = sum(selected credit amounts)`
   - `difference = debitTotal - creditTotal`

4. **Full reconciliation**
   - when `difference == 0` and each selected amount consumes desired open.

5. **Partial reconciliation**
   - allow `selectedAmount < openAmount` per line.
   - still require overall balanced debit/credit amounts for submission.

6. **Overpayment / unapplied credit**
   - if payment credit remaining > invoice open after allocations, payment status shows `UNAPPLIED_CREDIT`.
   - represent unapplied residual as open credit line in ledger.

7. **Preview before submit**
   - build `ReconciliationPreview` showing resulting open amounts and warnings.
   - warn on near-zero residual due to rounding.

8. **Safe unreconcile**
   - require explicit reason.
   - display impacted documents and resulting status changes before confirmation.
   - after submit, refresh all affected line/document pages.

---

## 5) Status calculation rules (journal-line based)

### Invoice status
Given invoice receivable/payable lines:
- `invoiceAmount = absolute(sum(natural side amounts))`
- `appliedAmount = sum(reconciled allocations against those lines)`
- `residual = invoiceAmount - appliedAmount`

Rules:
- `residual == invoiceAmount` => `OPEN`
- `0 < residual < invoiceAmount` => `PARTIALLY_PAID`
- `residual == 0` => `PAID`
- `residual < 0` => `OVERPAID`

### Payment status
Given payment line(s):
- `paymentAmount = absolute(payment line amount)`
- `allocated = sum(reconciled allocations from payment lines)`
- `unapplied = paymentAmount - allocated`

Rules:
- `allocated == 0` => `UNRECONCILED_PAYMENT`
- `0 < allocated < paymentAmount` => `PARTIALLY_PAID`
- `allocated == paymentAmount` => `PAID`
- `unapplied > 0` with at least one allocation => `UNAPPLIED_CREDIT`
- `allocated > paymentAmount` (rare data anomaly/adjustment) => `OVERPAID`

Use decimal-safe compare with tolerance (`0.01` or currency precision).

---

## 6) State management (Pinia)

```ts
export interface ReconciliationState {
  ledgerByScope: Record<string, JournalEntryLine[]>; // key: partyType:partyId:currency
  candidates: JournalEntryLine[];
  selected: Array<{
    journalLineId: number;
    side: EntrySide;
    openAmount: Money;
    selectedAmount: Money;
    reconciliationVersion: number;
  }>;
  totals: {
    debitTotal: Money;
    creditTotal: Money;
    difference: Money;
  };
  preview: ReconciliationPreview | null;
  operations: {
    isFetchingCandidates: boolean;
    isPreviewing: boolean;
    isReconciling: boolean;
    isUnreconciling: boolean;
    lastOperationAt?: string;
  };
  errors: {
    fetch?: string;
    validation?: string;
    preview?: string;
    reconcile?: string;
    unreconcile?: string;
    stale?: string;
  };
  refreshTokens: {
    ledger: number;
    invoice: number;
    payment: number;
    history: number;
  };
}
```

### Store rules
- Derived getters compute totals/difference from `selected`, not UI component local vars.
- Actions only mutate through typed functions (`addLine`, `updateSelectedAmount`, `removeLine`, `clearSelection`).
- Preview invalidated when selection changes.
- Submit actions lock while in-flight.
- On conflict (409/version mismatch), raise stale error and trigger re-fetch.

---

## 7) API integration design

### Endpoints
- `POST /accounting/reconcile`
- `POST /accounting/unreconcile`
- `GET /accounting/reconciliations`
- `GET /customers/:id/ledger`
- `GET /suppliers/:id/ledger`

### Request construction
- Build from store `selected` preserving positional index:
  - `journalLineIds = selected.map(x => x.journalLineId)`
  - `amounts = selected.map(x => x.selectedAmount)`
  - `expectedVersions` from each line version.

### Response mapping
- Normalize amounts to decimal strings.
- Map reconciliation records into `Reconciliation` + indexes by line id.
- Update local caches pessimistically by refetching affected resources.

### Validation error surfacing
- 400 validation -> map field errors to row-level inline messages.
- 409 conflict/stale -> banner: “Line changed by another user, data reloaded.”
- 422 business rule -> toast + details panel.

### Stale data strategy
- Send line versions in request.
- On mismatch, clear preview, reload ledger and history, keep user selection attempt in draft for re-apply.

### Refresh after changes
After reconcile/unreconcile success:
1. bump `refreshTokens.history`
2. refetch affected customer/supplier ledgers by party ids present in selected lines
3. refetch invoice detail caches for touched invoice ids
4. refetch payment detail caches for touched payment ids
5. clear selection and preview

---

## 8) Edge-case handling

- **Partial payment**: allow partial selected amount on payment line and/or invoice line; status becomes partially paid.
- **Multiple payments for one invoice**: invoice applied amount is sum across all reconciliation lines linked to invoice lines.
- **One payment for multiple invoices**: allocation distribution handled in selection table with per-line selected amounts.
- **Overpayment**: if allocations exceed invoice amount, invoice status `OVERPAID`; residual credit remains open on payment or credit note lines.
- **Advance payment**: payment posted before invoice remains `UNRECONCILED_PAYMENT` until applied.
- **Unapplied credit**: allocated < payment amount with positive remainder => `UNAPPLIED_CREDIT`.
- **Already reconciled line selected**: blocked in validator; show inline reason.
- **Concurrent reconcile**: detect via version conflict; reload and rebuild preview.
- **Stale invoice cache**: invoice status always recomputed from fresh line data after reconciliation events.
- **Rounding issues**: compare using currency precision utilities; surface “rounding residual” warning if abs(diff) <= tolerance.
- **Reversed reconciliation**: history marks `REVERSED`; status calculations exclude reversed records.
- **Legacy flags conflict**: show backend legacy invoice `isPaid` as informational only; authoritative status from computed rule.

---

## 9) Pseudocode

```ts
function computeInvoiceStatus(lines: JournalEntryLine[], reconciliations: ReconciliationLine[]): InvoiceStatusView {
  const invoiceLines = lines.filter(isInvoiceControlLine)
  const invoiceAmount = abs(sumNaturalAmount(invoiceLines))
  const appliedAmount = sumAppliedForLines(invoiceLines.map(l => l.id), reconciliations)
  const residual = round(invoiceAmount - appliedAmount)

  let status: InvoiceStatus
  if (eq(residual, invoiceAmount)) status = 'OPEN'
  else if (gt(residual, 0) && lt(residual, invoiceAmount)) status = 'PARTIALLY_PAID'
  else if (eq(residual, 0)) status = 'PAID'
  else status = 'OVERPAID'

  return { invoiceId, invoiceNo, currency, invoiceAmount, appliedAmount, residualAmount: residual, status, reconciledLineIds, asOf: nowIso() }
}

function computePaymentStatus(paymentLines: JournalEntryLine[], reconciliations: ReconciliationLine[]): PaymentStatusView {
  const paymentAmount = abs(sumNaturalAmount(paymentLines))
  const allocated = sumAppliedForLines(paymentLines.map(l => l.id), reconciliations)
  const unapplied = round(paymentAmount - allocated)

  let status: PaymentStatus
  if (eq(allocated, 0)) status = 'UNRECONCILED_PAYMENT'
  else if (gt(allocated, paymentAmount)) status = 'OVERPAID'
  else if (eq(allocated, paymentAmount)) status = 'PAID'
  else if (gt(unapplied, 0)) status = 'UNAPPLIED_CREDIT'
  else status = 'PARTIALLY_PAID'

  return { paymentId, paymentNo, currency, paymentAmount, allocatedAmount: allocated, unappliedAmount: unapplied, status, allocatedInvoiceIds, asOf: nowIso() }
}

function validateReconciliationSelection(selected): { valid: boolean; errors: string[] } {
  const errors = []
  if (selected.length < 2) errors.push('Select at least two lines.')
  if (!hasBothSides(selected)) errors.push('Selection must include debit and credit lines.')
  if (!sameCurrency(selected)) errors.push('All selected lines must share currency.')

  for (const row of selected) {
    if (lte(row.selectedAmount, 0)) errors.push(`Line ${row.journalLineId}: amount must be > 0`)
    if (gt(row.selectedAmount, row.openAmount)) errors.push(`Line ${row.journalLineId}: amount exceeds open amount`)
    if (row.isFullyReconciled) errors.push(`Line ${row.journalLineId}: already fully reconciled`)
  }

  const debitTotal = sumDebit(selected)
  const creditTotal = sumCredit(selected)
  if (!eq(debitTotal, creditTotal)) errors.push('Debits and credits are not balanced.')

  return { valid: errors.length === 0, errors }
}

function buildReconciliationPreview(selected): ReconciliationPreview {
  const debitTotal = sumDebit(selected)
  const creditTotal = sumCredit(selected)
  const difference = round(debitTotal - creditTotal)
  const allocations = selected.map(row => ({
    journalLineId: row.journalLineId,
    side: row.side,
    selectedAmount: row.selectedAmount,
    availableOpenAmount: row.openAmount,
    resultingOpenAmount: round(row.openAmount - row.selectedAmount),
  }))
  const warnings = []
  if (!eq(difference, 0)) warnings.push('Selection is not balanced.')
  if (allocations.some(a => lt(a.resultingOpenAmount, 0))) warnings.push('Negative resulting open amount detected.')

  return { currency: inferCurrency(selected), debitTotal, creditTotal, difference, isBalanced: eq(difference, 0), isPartial: allocations.some(a => gt(a.resultingOpenAmount, 0)), allocations, warnings }
}

async function submitReconciliation(store) {
  const validation = validateReconciliationSelection(store.selected)
  if (!validation.valid) throw new ValidationError(validation.errors)

  store.operations.isReconciling = true
  try {
    const request: ReconciliationRequest = {
      journalLineIds: store.selected.map(s => s.journalLineId),
      amounts: store.selected.map(s => s.selectedAmount),
      expectedVersions: store.selected.map(s => ({ journalLineId: s.journalLineId, reconciliationVersion: s.reconciliationVersion })),
    }

    const response = await reconciliationApi.reconcile(request)
    await refreshAffectedData(response)
    store.clearSelection()
  } catch (e) {
    handleReconciliationError(e, store)
    throw e
  } finally {
    store.operations.isReconciling = false
  }
}

async function submitUnreconciliation(reconciliationId: number, reason: string, store) {
  store.operations.isUnreconciling = true
  try {
    const req: UnreconciliationRequest = { reconciliationId, reason }
    const response = await reconciliationApi.unreconcile(req)
    await refreshAffectedData(response)
  } catch (e) {
    handleUnreconciliationError(e, store)
    throw e
  } finally {
    store.operations.isUnreconciling = false
  }
}

async function refreshAffectedData(eventPayload) {
  const partyIds = extractPartyIds(eventPayload)
  const invoiceIds = extractInvoiceIds(eventPayload)
  const paymentIds = extractPaymentIds(eventPayload)

  await Promise.all([
    refetchReconciliationHistory(),
    ...partyIds.map(refetchLedgerForParty),
    ...invoiceIds.map(refetchInvoiceDetails),
    ...paymentIds.map(refetchPaymentDetails),
  ])

  emitAccountingRefreshEvent(eventPayload)
}
```

---

## 10) Step-by-step refactor strategy

1. **Inventory current logic**
   - locate all places where invoice/payment status is derived from document flags.
2. **Introduce canonical types**
   - add `types/reconciliation.ts` + `status.ts` and migrate consumers.
3. **Create pure status utility layer**
   - implement/test `computeInvoiceStatus`, `computePaymentStatus`, money comparators.
4. **Introduce reconciliation store**
   - centralize selection, totals, preview, submit operations.
5. **Refactor existing pages gradually behind feature flag**
   - `accounting.reconciliationV2`.
6. **Build reconciliation workspace first**
   - enables correct allocations and preview semantics.
7. **Wire history page + unreconcile flow**
   - include mandatory reason, audit timeline, reversal state handling.
8. **Replace invoice/payment badges**
   - old flags become secondary debug info only.
9. **Cross-screen refresh orchestration**
   - event bus/store token strategy to avoid stale data.
10. **Concurrency hardening**
   - line version checks + conflict UX.
11. **Data migration fallback UX**
   - if legacy records missing versions, force refresh-before-submit.
12. **Testing rollout**
   - unit tests for status rules/validators, component tests for workspace totals, e2e for partial/full/unreconcile.
13. **Deprecate legacy UI paths**
   - remove document-level “paid if payment exists” code once parity achieved.

### Acceptance criteria
- Any status shown on invoice/payment can be traced to journal lines + reconciliation records.
- Reconciliation/unreconciliation updates all dependent views without manual reload.
- Partial and multi-document applications remain numerically consistent under rounding constraints.
- Audit history clearly shows who reconciled/unreconciled, when, and what lines were affected.
