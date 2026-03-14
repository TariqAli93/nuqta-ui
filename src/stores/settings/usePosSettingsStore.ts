import { settingsApi } from '../../services/settingsApi';
import { createSettingsStore } from './createSettingsStore';
import type { PosSettings } from '../../types/settings/PosSettings';

export const usePosSettingsStore = createSettingsStore<PosSettings>(
  'posSettings',
  () => settingsApi.pos
);
