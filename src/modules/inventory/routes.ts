import type { RouteRecordRaw } from 'vue-router';

const InventoryWorkspaceView = () => import('../../views/inventory/InventoryWorkspaceView.vue');
const StockOverviewView = () => import('../../views/inventory/StockOverviewView.vue');
const StockMovementsView = () => import('../../views/inventory/StockMovementsView.vue');
const StockReconciliationView = () => import('../../views/inventory/StockReconciliationView.vue');
const StockAlertsView = () => import('../../views/inventory/StockAlertsView.vue');

export const inventoryRoutes: RouteRecordRaw[] = [
  {
    path: 'inventory',
    component: InventoryWorkspaceView,
    meta: {
      requiresAccounting: true,
      requiresViewInventory: true,
      breadcrumb: { title: 'nav.inventoryManagement', to: '/inventory/overview' },
    },
    children: [
      {
        path: '',
        name: 'Inventory',
        redirect: { name: 'InventoryOverview' },
      },
      {
        path: 'overview',
        name: 'InventoryOverview',
        component: StockOverviewView,
        meta: { breadcrumb: { title: 'nav.stockOverview' } },
      },
      {
        path: 'movements',
        name: 'InventoryMovements',
        component: StockMovementsView,
        meta: { breadcrumb: { title: 'nav.stockMovements' } },
      },
      {
        path: 'reconciliation',
        name: 'InventoryReconciliation',
        component: StockReconciliationView,
        meta: { breadcrumb: { title: 'nav.reconciliation' } },
      },
      {
        path: 'alerts',
        name: 'InventoryAlerts',
        component: StockAlertsView,
        meta: { breadcrumb: { title: 'nav.stockAlerts' } },
      },
    ],
  },
  // Legacy redirects for backward compatibility
  {
    path: 'inventory/adjustments/new',
    name: 'StockAdjustment',
    redirect: { name: 'InventoryOverview' },
    meta: { requiresAdjustStock: true, requiresAccounting: true, requiresViewInventory: true },
  },
  {
    path: 'workspace/finance',
    name: 'FinanceInventoryWorkspace',
    redirect: (to) => {
      const section = to.query.section as string;
      const accountingTab = to.query.accountingTab as string;

      if (section === 'accounting') {
        if (accountingTab === 'journal') return { name: 'AccountingJournal' };
        if (accountingTab === 'trial') return { name: 'AccountingTrialBalance' };
        if (accountingTab === 'pnl') return { name: 'AccountingProfitLoss' };
        if (accountingTab === 'balance') return { name: 'AccountingBalanceSheet' };
        return { name: 'AccountingAccounts' };
      }
      if (section === 'reconciliation') return { name: 'InventoryReconciliation' };
      if (section === 'ar') return { name: 'CustomerLedger' };
      if (section === 'ap') return { name: 'SupplierLedger' };
      return { name: 'InventoryOverview' };
    },
  },
];
