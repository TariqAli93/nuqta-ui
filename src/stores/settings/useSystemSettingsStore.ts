import { settingsApi } from '../../services/settingsApi';
import { createSettingsStore } from './createSettingsStore';
import type { SystemSettings } from '../../types/settings/SystemSettings';

export const useSystemSettingsStore = createSettingsStore<SystemSettings>(
  'systemSettings',
  () => settingsApi.system
);
