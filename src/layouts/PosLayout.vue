<template>
  <v-app>
    <v-navigation-drawer
      v-model="appNavigationDrawer"
      location="right"
      border="left"
      permanent
      width="300"
      class="pos-nav-drawer"
    >
      <div
        class="border-0 border-b border-(--v-theme-background) mb-2 px-3 h-12.25 flex items-center ga-3"
      >
        <!-- add logo here -->
        <v-img
          :src="logo"
          lazy-src="../assets/logo.png"
          alt="Logo"
          contain
          max-width="32"
          max-height="32"
        />
        <span class="text-subtitle-2">نقطة بلس</span>
      </div>
      <v-list nav density="compact" :opened="openedGroups" class="px-2 py-2">
        <template v-for="entry in primaryNav" :key="entry.type === 'item' ? entry.to : entry.id">
          <v-list-item
            v-if="entry.type === 'item'"
            :to="entry.to"
            :prepend-icon="entry.icon"
            :active="isNavActive(entry.to)"
            exact
          >
            <v-list-item-title>{{ entry.label }}</v-list-item-title>
          </v-list-item>

          <v-list-group v-else :value="entry.id">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="entry.icon">
                <v-list-item-title>{{ entry.label }}</v-list-item-title>
              </v-list-item>
            </template>

            <div class="nav-group-children">
              <template
                v-for="child in entry.children"
                :key="child.type === 'item' ? child.to : child.id"
              >
                <v-list-item
                  v-if="child.type === 'item'"
                  :to="child.to"
                  :prepend-icon="child.icon"
                  :active="isNavActive(child.to)"
                  exact
                >
                  <v-list-item-title>{{ child.label }}</v-list-item-title>
                </v-list-item>
              </template>
            </div>
          </v-list-group>
        </template>
      </v-list>

      <template #append>
        <v-divider class="my-2" />
        <v-list nav density="compact" class="px-2 pb-2">
          <v-list-subheader class="text-caption">النظام</v-list-subheader>
          <v-list-item
            v-for="item in footerNav"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
          >
            <v-list-item-title>{{ item.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat density="comfortable" height="56" border="bottom">
      <v-sheet class="d-flex align-center ga-4 px-6">
        <v-app-bar-nav-icon @click="appNavigationDrawer = !appNavigationDrawer" />
        <div>
          <div class="text-caption text-medium-emphasis">
            {{ currentDate }} <span class="mx-2">|</span> {{ currentUser }}
          </div>
        </div>
        <v-card class="d-flex align-center ga-2 px-3 py-1">
          <v-icon size="16">mdi-clock-outline</v-icon>
          <span class="text-caption">{{ t('pos.shift') }}:</span>
          <span class="text-caption">{{ shiftTime }}</span>
        </v-card>
      </v-sheet>

      <v-spacer />

      <ConnectionStatus />
      <v-tooltip :text="sseConnected ? t('layout.sseConnected') : t('layout.sseDisconnected')">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon size="small" class="mr-2">
            <v-icon :color="sseConnected ? 'success' : 'grey'">
              {{ sseConnected ? 'mdi-lan-connect' : 'mdi-lan-disconnect' }}
            </v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-btn variant="text" class="win-ghost-btn" @click="toggleTheme">
        <v-icon> mdi-theme-light-dark </v-icon>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn variant="text" icon size="small" v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list nav density="comfortable">
          <v-list-item to="/profile" prepend-icon="mdi-account-outline">
            <v-list-item-title>{{ t('nav.profile') }}</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" @click="logout">
            <v-list-item-title>{{ t('common.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useVuetifyStore } from '@/stores/vuetify';
import { t } from '@/i18n/t';
import * as uiAccess from '@/auth/uiAccess';
import { useTheme } from 'vuetify';
import { initEventBridge, destroyEventBridge } from '@/plugins/eventBridge';
import ConnectionStatus from '@/components/shared/ConnectionStatus.vue';
import { useInventoryAlerts } from '@/composables/useInventoryAlerts';

// import logo from '../assets/logo.png';
const logo = new URL('../assets/logo.png', import.meta.url).href;

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const vuetifyStore = useVuetifyStore();
const vuetifyTheme = useTheme();

/** Toggle theme in both Vuetify runtime and the persisted store. */
function toggleTheme() {
  // vuetifyTheme.global.name.value = vuetifyTheme.global.name.value === 'dark' ? 'light' : 'dark';
  vuetifyTheme.change(vuetifyTheme.global.name.value === 'dark' ? 'light' : 'dark');
  vuetifyStore.toggleTheme();
}

const appNavigationDrawer = ref(true);
const { connected: sseConnected } = useInventoryAlerts();

const currentUser = computed(() => authStore.user?.username ?? t('common.none'));
const currentDate = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'numeric',
    day: '2-digit',
    numberingSystem: 'latn',
  });
});

const shiftTime = computed(() => {
  const now = new Date();
  return now.toLocaleTimeString('ar-IQ', {
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  });
});

interface NavItem {
  type: 'item';
  to: string;
  icon: string;
  label: string;
  visible?: boolean;
}

interface NavSubGroup {
  type: 'group';
  id: string;
  icon: string;
  label: string;
  children: NavItem[];
}

interface NavGroup {
  type: 'group';
  id: string;
  icon: string;
  label: string;
  visible?: boolean;
  children: (NavItem | NavSubGroup)[];
}

type NavEntry = NavItem | NavGroup;

const isNavActive = (to: string): boolean => {
  return router.resolve(to).href === route.path;
};

const openedGroups = computed(() => {
  const path = route.path;
  const name = route.name as string | undefined;
  const groups: string[] = [];

  // Inventory Management
  if (path.startsWith('/inventory')) {
    groups.push('inventory-management');
  }

  // Accounting
  if (path.startsWith('/accounting')) {
    groups.push('accounting');
    if (name === 'AccountingProfitLoss' || name === 'AccountingBalanceSheet') {
      groups.push('accounting-reports');
    }
  }

  // Customer Management
  if (path.startsWith('/customers')) {
    groups.push('customer-management');
  }

  // Supplier Management
  if (path.startsWith('/suppliers')) {
    groups.push('supplier-management');
  }

  return groups;
});

const primaryNav = computed((): NavEntry[] => {
  const role = authStore.user?.role;
  if (!role) return [];

  const entries: (NavEntry & { visible?: boolean })[] = [
    {
      type: 'item',
      to: '/pos',
      icon: 'mdi-point-of-sale',
      label: t('nav.pos'),
      visible: uiAccess.canCreateSales(role),
    },
    {
      type: 'item',
      to: '/products',
      icon: 'mdi-package-variant',
      label: t('nav.products'),
      visible: uiAccess.canManageProducts(role),
    },
    {
      type: 'group',
      id: 'inventory-management',
      icon: 'mdi-warehouse',
      label: t('nav.inventoryManagement'),
      visible: uiAccess.canViewInventory(role),
      children: [
        {
          type: 'item',
          to: '/inventory/overview',
          icon: 'mdi-package-variant-closed',
          label: t('nav.stockOverview'),
        },
        {
          type: 'item',
          to: '/inventory/movements',
          icon: 'mdi-swap-horizontal',
          label: t('nav.stockMovements'),
        },
        {
          type: 'item',
          to: '/inventory/reconciliation',
          icon: 'mdi-clipboard-check-outline',
          label: t('nav.reconciliation'),
        },
        {
          type: 'item',
          to: '/inventory/alerts',
          icon: 'mdi-alert-outline',
          label: t('nav.stockAlerts'),
        },
      ],
    },
    {
      type: 'item',
      to: '/categories',
      icon: 'mdi-shape-outline',
      label: t('nav.categories'),
      visible: uiAccess.canManageProducts(role),
    },
    {
      type: 'item',
      to: '/purchases',
      icon: 'mdi-cart-arrow-down',
      label: t('nav.purchases'),
      visible: uiAccess.canManagePurchases(role),
    },
    {
      type: 'item',
      to: '/sales',
      icon: 'mdi-receipt-text',
      label: t('nav.sales'),
      visible: uiAccess.canCreateSales(role),
    },
    {
      type: 'group',
      id: 'accounting',
      icon: 'mdi-calculator',
      label: t('nav.accounting'),
      visible: uiAccess.canViewAccounting(role),
      children: [
        {
          type: 'item',
          to: '/accounting/accounts',
          icon: 'mdi-file-tree',
          label: t('nav.chartOfAccounts'),
        },
        {
          type: 'item',
          to: '/accounting/journal',
          icon: 'mdi-book-open-page-variant',
          label: t('nav.journalEntries'),
        },
        {
          type: 'item',
          to: '/accounting/trial-balance',
          icon: 'mdi-scale-unbalanced',
          label: t('nav.trialBalance'),
        },
        {
          type: 'item',
          to: '/accounting/profit-loss',
          icon: 'mdi-chart-line',
          label: t('nav.profitLoss'),
        },
        {
          type: 'item',
          to: '/accounting/balance-sheet',
          icon: 'mdi-scale-balance',
          label: t('nav.balanceSheet'),
        },

        {
          type: 'item',
          to: '/accounting/posting',
          icon: 'mdi-send-check',
          label: t('nav.posting'),
        },
      ],
    },
    {
      type: 'group',
      id: 'customer-management',
      icon: 'mdi-account-group',
      label: t('nav.customerManagement'),
      visible: uiAccess.canManageCustomers(role),
      children: [
        {
          type: 'item',
          to: '/customers',
          icon: 'mdi-account-multiple',
          label: t('nav.customers'),
        },
        {
          type: 'item' as const,
          to: '/customers/ledger',
          icon: 'mdi-book-account',
          label: t('nav.customerLedger'),
        },
      ],
    },
    {
      type: 'group',
      id: 'supplier-management',
      icon: 'mdi-truck-delivery',
      label: t('nav.supplierManagement'),
      visible: uiAccess.canManageSuppliers(role),
      children: [
        {
          type: 'item',
          to: '/suppliers',
          icon: 'mdi-domain',
          label: t('nav.suppliers'),
        },

        {
          type: 'item' as const,
          to: '/suppliers/ledger',
          icon: 'mdi-book-account',
          label: t('nav.supplierLedger'),
        },
      ],
    },
  ];

  return entries.filter((entry) => entry.visible !== false) as NavEntry[];
});

const footerNav = computed(() => {
  const role = authStore.user?.role;
  if (!role) return [];

  return [
    {
      to: '/dashboard',
      icon: 'mdi-view-dashboard',
      label: 'لوحة المعلومات',
      visible: true,
    },
    {
      to: '/backup',
      icon: 'mdi-backup-restore',
      label: 'النسخ الاحتياطي',
      visible: role === 'admin' || role === 'manager',
    },

    {
      to: '/settings',
      icon: 'mdi-cog',
      label: t('nav.settings'),
      visible: uiAccess.canManageSettings(role),
    },
    { to: '/about', icon: 'mdi-information-outline', label: t('nav.about'), visible: true },
  ].filter((item) => item.visible);
});

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};

// Watch authentication status and logout if not authenticated
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (!isAuth) {
      logout();
    }
  }
);

onMounted(async () => {
  // Check authentication on mount
  if (!authStore.isAuthenticated) {
    logout();
    return;
  }

  // Start real-time event stream for multi-terminal sync
  initEventBridge();
});

onUnmounted(() => {
  destroyEventBridge();
});
</script>
<style scoped>
:deep(.v-list-group__items) {
  padding-inline-start: 0; /* يمنع Vuetify يزود indent زائد */
}

.nav-group-children {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 6px;
  margin-inline-start: 10px;
  margin-block: 4px;
}

.nav-group-children :deep(.v-list-item) {
  border-radius: 10px;
  margin-block: 2px;
  padding-inline-start: 18px !important;
}

.nav-group-children :deep(.v-list-item:hover) {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.nav-group-children :deep(.v-list-item.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.18);
}
</style>
