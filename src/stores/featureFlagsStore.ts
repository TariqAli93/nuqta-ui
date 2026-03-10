import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { setupClient, type AccountingSetupStatus } from '../api/endpoints/setup';
import { settingsClient, type AllModuleSettings } from '../api/endpoints/settings';

export const useFeatureFlagsStore = defineStore('featureFlags', () => {
  const initialized = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const accountingEnabledDecision = ref<boolean | null>(true);
  const coaSeeded = ref(true);

  // ── Module toggle state ──
  const purchasesEnabled = ref(true);
  const ledgersEnabled = ref(true);
  const unitsEnabled = ref(true);
  const paymentsOnInvoicesEnabled = ref(true);
  const wizardCompleted = ref(false);

  const accountingEnabled = computed(() => accountingEnabledDecision.value === true);
  const accountingReady = computed(() => accountingEnabled.value && coaSeeded.value);
  const simpleMode = computed(() => accountingEnabledDecision.value === false);

  function applyStatus(status: AccountingSetupStatus): void {
    accountingEnabledDecision.value = status.enabled;
    coaSeeded.value = status.seeded;
    initialized.value = true;
    error.value = null;
  }

  function applyModuleSettings(data: AllModuleSettings): void {
    // Do NOT overwrite accountingEnabledDecision here — applyStatus is the
    // authoritative source (reads 'accounting.enabled' via setup:getAccountingSetupStatus).
    // Only apply the per-module toggles.

    if (!data || Object.keys(data).length === 0) return;
    purchasesEnabled.value = data.modules.purchasesEnabled;
    ledgersEnabled.value = data.modules.ledgersEnabled;
    unitsEnabled.value = data.modules.unitsEnabled;
    paymentsOnInvoicesEnabled.value = data.modules.paymentsOnInvoicesEnabled;
    wizardCompleted.value = data.wizardCompleted;
  }

  async function hydrate(force = false): Promise<void> {
    try {
      if (initialized.value && !force) return;
      loading.value = true;
      error.value = null;

      const [status, moduleSettings] = await Promise.all([
        setupClient.getAccountingSetupStatus(),
        settingsClient.getModules(),
      ]);

      if (status.ok) applyStatus(status.data);
      else throw new Error(`Failed to fetch accounting setup status: ${status.error}`);

      if (moduleSettings.ok) applyModuleSettings(moduleSettings.data);
      else throw new Error(`Failed to fetch module settings: ${moduleSettings.error}`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    initialized,
    loading,
    error,
    accountingEnabledDecision,
    accountingEnabled,
    accountingReady,
    simpleMode,
    coaSeeded,
    // Module toggles
    purchasesEnabled,
    ledgersEnabled,
    unitsEnabled,
    paymentsOnInvoicesEnabled,
    wizardCompleted,
    hydrate,
    applyStatus,
    applyModuleSettings,
  };
});
