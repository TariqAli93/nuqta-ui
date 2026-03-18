import type { RouteRecordRaw } from 'vue-router';

const AccountingWorkspaceView = () => import('../../views/accounting/AccountingWorkspaceView.vue');
const ChartOfAccountsView = () => import('../../views/accounting/ChartOfAccountsView.vue');
const JournalEntriesView = () => import('../../views/accounting/JournalEntriesView.vue');
const TrialBalanceView = () => import('../../views/accounting/TrialBalanceView.vue');
const ProfitLossView = () => import('../../views/accounting/ProfitLossView.vue');
const BalanceSheetView = () => import('../../views/accounting/BalanceSheetView.vue');
const PostingView = () => import('../../views/accounting/PostingView.vue');
const InvoicePaymentsView = () => import('../../views/accounting/InvoicePaymentsView.vue');
const JournalEntryDetailView = () => import('../../views/accounting/JournalEntryDetailView.vue');
const CreateJournalEntryView = () => import('../../views/accounting/CreateJournalEntryView.vue');
const GeneralLedgerView = () => import('../../views/accounting/GeneralLedgerView.vue');

export const accountingRoutes: RouteRecordRaw[] = [
  {
    path: 'accounting',
    component: AccountingWorkspaceView,
    meta: { requiresAccounting: true, permissions: ['accounting:read'] },
    children: [
      {
        path: '',
        name: 'Accounting',
        redirect: { name: 'AccountingAccounts' },
      },
      {
        path: 'accounts',
        name: 'AccountingAccounts',
        component: ChartOfAccountsView,
      },
      {
        path: 'journal',
        name: 'AccountingJournal',
        component: JournalEntriesView,
      },
      {
        path: 'posting',
        name: 'AccountingPosting',
        component: PostingView,
      },
      {
        path: 'trial-balance',
        name: 'AccountingTrialBalance',
        component: TrialBalanceView,
      },
      {
        path: 'profit-loss',
        name: 'AccountingProfitLoss',
        component: ProfitLossView,
      },
      {
        path: 'balance-sheet',
        name: 'AccountingBalanceSheet',
        component: BalanceSheetView,
      },
    ],
  },
  {
    path: 'accounting/journal/new',
    name: 'JournalEntryCreate',
    component: CreateJournalEntryView,
    meta: { requiresAccounting: true, permissions: ['accounting:update'] },
  },
  {
    path: 'accounting/accounts/:accountId/ledger',
    name: 'AccountLedger',
    component: GeneralLedgerView,
    meta: { requiresAccounting: true, permissions: ['accounting:read'] },
  },
  {
    path: 'accounting/journal/:id',
    name: 'JournalEntryDetail',
    component: JournalEntryDetailView,
    meta: { requiresAccounting: true, permissions: ['accounting:read'] },
  },
  {
    path: 'invoice-payments',
    name: 'InvoicePayments',
    component: InvoicePaymentsView,
    meta: {
      requiresLedgers: true,
      requiresPaymentsOnInvoices: true,
      permissions: ['accounting:read'],
    },
  },
  // Legacy redirects for backward compatibility
  {
    path: 'accounting/reports/trial-balance',
    name: 'TrialBalance',
    redirect: { name: 'AccountingTrialBalance' },
  },
  {
    path: 'accounting/reports/pnl',
    name: 'ProfitLoss',
    redirect: { name: 'AccountingProfitLoss' },
  },
  {
    path: 'accounting/reports/balance-sheet',
    name: 'BalanceSheet',
    redirect: { name: 'AccountingBalanceSheet' },
  },
  {
    path: 'accounting/posting',
    name: 'Posting',
    redirect: { name: 'AccountingPosting' },
  },
];
