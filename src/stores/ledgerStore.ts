import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { customerLedgerClient, customersClient, supplierLedgerClient, suppliersClient } from '../api';
import type { CustomerLedgerEntry, SupplierLedgerEntry, Customer, Supplier } from '../types/domain';

interface LedgerLoadingState {
  customers: boolean;
  suppliers: boolean;
  customerLedger: boolean;
  supplierLedger: boolean;
  reconciliation: boolean;
}

const initialLoadingState = (): LedgerLoadingState => ({
  customers: false,
  suppliers: false,
  customerLedger: false,
  supplierLedger: false,
  reconciliation: false,
});

export const useLedgerStore = defineStore('ledger', () => {
  const customers = ref<Customer[]>([]);
  const customersTotal = ref(0);
  const suppliers = ref<Supplier[]>([]);
  const suppliersTotal = ref(0);

  const selectedCustomerId = ref<number | null>(null);
  const selectedSupplierId = ref<number | null>(null);

  const customerLedgerEntries = ref<CustomerLedgerEntry[]>([]);
  const customerLedgerTotal = ref(0);

  const supplierLedgerEntries = ref<SupplierLedgerEntry[]>([]);
  const supplierLedgerTotal = ref(0);

  const customerReconciliation = ref<unknown | null>(null);
  const supplierReconciliation = ref<unknown | null>(null);

  const loading = reactive<LedgerLoadingState>(initialLoadingState());
  const error = ref<string | null>(null);

  const isBusy = computed(() => Object.values(loading).some(Boolean));

  function resetError(): void {
    error.value = null;
  }

  function setError(message: string | undefined): void {
    error.value = message || 'Unknown ledger error';
  }

  async function fetchCustomers(params?: { search?: string; limit?: number; offset?: number }) {
    loading.customers = true;
    resetError();
    try {
      const result = await customersClient.getAll(params);
      if (result.ok) {
        customers.value = result.data.items as Customer[];
        customersTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل العملاء');
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.customers = false;
    }
  }

  async function fetchSuppliers(params?: { search?: string; limit?: number; offset?: number }) {
    loading.suppliers = true;
    resetError();
    try {
      const result = await suppliersClient.getAll(params);
      if (result.ok) {
        suppliers.value = result.data.items as Supplier[];
        suppliersTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الموردين');
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.suppliers = false;
    }
  }

  async function fetchCustomerLedger(
    customerId: number,
    params?: { dateFrom?: string; dateTo?: string; limit?: number; offset?: number }
  ) {
    loading.customerLedger = true;
    resetError();
    selectedCustomerId.value = customerId;
    try {
      const result = await customerLedgerClient.getLedger(customerId, params);
      if (result.ok) {
        customerLedgerEntries.value = result.data.items;
        customerLedgerTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل كشف حساب العميل');
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.customerLedger = false;
    }
  }

  async function fetchSupplierLedger(
    supplierId: number,
    params?: { dateFrom?: string; dateTo?: string; limit?: number; offset?: number }
  ) {
    loading.supplierLedger = true;
    resetError();
    selectedSupplierId.value = supplierId;
    try {
      const result = await supplierLedgerClient.getLedger(supplierId, params);
      if (result.ok) {
        supplierLedgerEntries.value = result.data.items;
        supplierLedgerTotal.value = result.data.total;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل كشف حساب المورد');
      return { ok: false as const, error: { code: 'FETCH_FAILED', message: error.value! } };
    } finally {
      loading.supplierLedger = false;
    }
  }

  async function reconcileCustomerDebt(repair = false) {
    loading.reconciliation = true;
    resetError();
    try {
      const result = await customerLedgerClient.reconcileDebt(repair);
      if (result.ok) {
        customerReconciliation.value = result.data;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في مطابقة ديون العملاء');
      return { ok: false as const, error: { code: 'RECONCILE_FAILED', message: error.value! } };
    } finally {
      loading.reconciliation = false;
    }
  }

  async function reconcileSupplierBalance(repair = false) {
    loading.reconciliation = true;
    resetError();
    try {
      const result = await supplierLedgerClient.reconcileBalance(repair);
      if (result.ok) {
        supplierReconciliation.value = result.data;
      } else {
        setError(result.error.message);
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في مطابقة أرصدة الموردين');
      return { ok: false as const, error: { code: 'RECONCILE_FAILED', message: error.value! } };
    } finally {
      loading.reconciliation = false;
    }
  }

  return {
    customers,
    customersTotal,
    suppliers,
    suppliersTotal,
    selectedCustomerId,
    selectedSupplierId,
    customerLedgerEntries,
    customerLedgerTotal,
    supplierLedgerEntries,
    supplierLedgerTotal,
    customerReconciliation,
    supplierReconciliation,
    loading,
    isBusy,
    error,
    fetchCustomers,
    fetchSuppliers,
    fetchCustomerLedger,
    fetchSupplierLedger,
    reconcileCustomerDebt,
    reconcileSupplierBalance,
  };
});

