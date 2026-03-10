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

export const accountingRoutes: RouteRecordRaw[] = [
  {
    path: 'accounting',
    component: AccountingWorkspaceView,
    meta: { requiresAccounting: true, requiresViewAccounting: true },
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
    path: 'accounting/posting',
    name: 'Posting',
    component: PostingView,
    meta: { requiresAccounting: true, requiresViewAccounting: true },
  },
  {
    path: 'accounting/journal/:id',
    name: 'JournalEntryDetail',
    component: JournalEntryDetailView,
    meta: { requiresAccounting: true, requiresViewAccounting: true },
  },
  {
    path: 'invoice-payments',
    name: 'InvoicePayments',
    component: InvoicePaymentsView,
    meta: {
      requiresLedgers: true,
      requiresPaymentsOnInvoices: true,
      requiresViewAccounting: true,
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
];
