import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettingsStore } from '@/stores/settings/useSystemSettingsStore';
import { useRBAC } from '@/composables/useRBAC';
import { t } from '@/i18n/t';

interface NavItem {
  type: 'item';
  to: string;
  icon: string;
  label: string;
  visible?: boolean;
  activeMode?: 'exact' | 'startsWith' | 'section'; // 'exact' for exact path match, 'startsWith' for matching any starting path, 'section' for matching any sub-paths
}

// head is used for non-clickable group headers
interface NavHead {
  type: 'head';
  id?: string;
  label: string;
  visible?: boolean;
  children?: NavItem[]; // Optional children for heads, but they won't be rendered as a group
}

export type NavEntry = NavItem | NavHead;

export interface FooterNavItem {
  to: string;
  icon: string;
  label: string;
  visible?: boolean;
}

export function usePosNavigation() {
  const authStore = useAuthStore();
  const route = useRoute();
  const systemSettingsStore = useSystemSettingsStore();
  const { can } = useRBAC();

  const appNavigationDrawer = ref(true);

  const isNavActive = (item: NavItem): boolean => {
    const currentPath = route.path.replace(/\/+$/, '');
    const targetPath = item.to.replace(/\/+$/, '');

    if (item.activeMode === 'section') {
      return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
    }

    return currentPath === targetPath;
  };

  const primaryNav = computed((): NavEntry[] => {
    if (!authStore.isAuthenticated) return [];

    const entries: (NavEntry & { visible?: boolean })[] = [
      {
        type: 'head',
        id: 'sales',
        label: t('nav.salesManagement'),
        visible: can('sales:read') || can('sales:create'),
      },
      {
        type: 'item',
        to: '/pos',
        icon: 'mdi-point-of-sale',
        label: t('nav.pos'),
        visible: can('sales:create'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/sales',
        icon: 'mdi-receipt-text',
        label: t('nav.sales'),
        visible: can('sales:read'),
        activeMode: 'exact',
      },

      //   start of inventory management
      {
        type: 'head',
        id: 'inventory-management',
        label: t('nav.inventoryManagement'),
        visible: can('inventory:read'),
      },
      {
        type: 'item',
        to: '/products',
        icon: 'mdi-package-variant',
        label: t('nav.products'),
        visible: can('products:read'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/categories',
        icon: 'mdi-shape-outline',
        label: t('nav.categories'),
        visible: can('products:read'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/purchases',
        icon: 'mdi-cart-arrow-down',
        label: t('nav.purchases'),
        visible: can('purchases:read') && systemSettingsStore.data?.purchasesEnabled,
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/inventory/overview',
        icon: 'mdi-package-variant-closed',
        label: t('nav.stockOverview'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/inventory/movements',
        icon: 'mdi-swap-horizontal',
        label: t('nav.stockMovements'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/inventory/reconciliation',
        icon: 'mdi-clipboard-check-outline',
        label: t('nav.reconciliation'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/inventory/alerts',
        icon: 'mdi-alert-outline',
        label: t('nav.stockAlerts'),
        activeMode: 'exact',
      },

      //   end of inventory management

      //   start of accounting
      {
        type: 'head',
        id: 'accounting',
        label: t('nav.accounting'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
      },

      {
        type: 'item',
        to: '/accounting/accounts',
        icon: 'mdi-file-tree',
        label: t('nav.chartOfAccounts'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/accounting/journal',
        icon: 'mdi-book-open-page-variant',
        label: t('nav.journalEntries'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/accounting/trial-balance',
        icon: 'mdi-scale-unbalanced',
        label: t('nav.trialBalance'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/accounting/profit-loss',
        icon: 'mdi-chart-line',
        label: t('nav.profitLoss'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/accounting/balance-sheet',
        icon: 'mdi-scale-balance',
        label: t('nav.balanceSheet'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/accounting/posting',
        icon: 'mdi-send-check',
        label: t('nav.posting'),
        visible: can('accounting:read') && systemSettingsStore.data?.accountingEnabled,
        activeMode: 'exact',
      },
      //   end of accounting

      //   start of customer management
      {
        type: 'head',
        id: 'customer-management',
        label: t('nav.customerManagement'),
        visible: can('customers:read'),
      },
      {
        type: 'item',
        to: '/customers',
        icon: 'mdi-account-group',
        label: t('nav.customers'),
        visible: can('customers:read'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/customers/ledger',
        icon: 'mdi-book-account',
        label: t('nav.customerLedger'),
        visible: can('customers:read') && systemSettingsStore.data?.ledgersEnabled,
        activeMode: 'exact',
      },
      //   end of customer management

      //   start of hr management
      {
        type: 'head',
        id: 'hr-management',
        label: t('nav.hrManagement'),
        visible: can('hr:read'),
      },
      {
        type: 'item',
        to: '/hr/employees',
        icon: 'mdi-account-hard-hat',
        label: t('nav.employees'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/hr/departments',
        icon: 'mdi-office-building',
        label: t('nav.departments'),
        activeMode: 'exact',
      },
      {
        type: 'item',
        to: '/hr/payroll',
        icon: 'mdi-cash-multiple',
        label: t('nav.payroll'),
        activeMode: 'exact',
      },
      //   end of hr management

      {
        type: 'head',
        id: 'supplier-management',
        label: t('nav.supplierManagement'),
        visible: can('suppliers:read'),
      },
      {
        type: 'item',
        to: '/suppliers',
        icon: 'mdi-domain',
        label: t('nav.suppliers'),
        activeMode: 'exact',
      },
      {
        type: 'item' as const,
        to: '/suppliers/ledger',
        icon: 'mdi-book-account',
        label: t('nav.supplierLedger'),
        visible: systemSettingsStore.data?.ledgersEnabled,
        activeMode: 'exact',
      },
    ];

    return entries
      .filter((entry) => entry.visible !== false)
      .map((entry) => {
        return entry;
      })
      .filter((entry) => entry.type === 'item' || entry.type === 'head') as NavEntry[];
  });

  const footerNav = computed(() => {
    if (!authStore.isAuthenticated) return [];

    return [
      {
        to: '/backup',
        icon: 'mdi-backup-restore',
        label: 'النسخ الاحتياطي',
        visible: can('backup:read'),
      },
      {
        to: '/settings',
        icon: 'mdi-cog',
        label: t('nav.settings'),
        visible: can('settings:read'),
      },
      { to: '/about', icon: 'mdi-information-outline', label: t('nav.about'), visible: true },
    ].filter((item) => item.visible);
  });

  return { appNavigationDrawer, isNavActive, primaryNav, footerNav };
}
