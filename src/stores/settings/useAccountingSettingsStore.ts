import { settingsApi } from '../../services/settingsApi';
import { createSettingsStore } from './createSettingsStore';
import type { AccountingSettings } from '../../types/settings/AccountingSettings';

export const useAccountingSettingsStore = createSettingsStore<AccountingSettings>(
  'accountingSettings',
  () => settingsApi.accounting
);
