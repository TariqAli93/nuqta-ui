import type { ApiResult } from '../api/contracts';
import { apiGet, apiPut, apiPost } from '../api/http';
import type { SystemSettings } from '../types/settings/SystemSettings';
import type { AccountingSettings } from '../types/settings/AccountingSettings';
import type { PosSettings } from '../types/settings/PosSettings';

export const settingsApi = {
  system: {
    get: (): Promise<ApiResult<SystemSettings>> => apiGet<SystemSettings>('/settings/system'),
    update: (data: Partial<SystemSettings>): Promise<ApiResult<SystemSettings>> =>
      apiPut<SystemSettings>('/settings/system', data),
  },

  accounting: {
    get: (): Promise<ApiResult<AccountingSettings>> =>
      apiGet<AccountingSettings>('/settings/accounting-v2'),
    update: (data: Partial<AccountingSettings>): Promise<ApiResult<AccountingSettings>> =>
      apiPut<AccountingSettings>('/settings/accounting-v2', data),
  },

  pos: {
    get: (): Promise<ApiResult<PosSettings>> => apiGet<PosSettings>('/settings/pos'),
    update: (data: Partial<PosSettings>): Promise<ApiResult<PosSettings>> =>
      apiPut<PosSettings>('/settings/pos', data),
  },

  completeSetup: (): Promise<ApiResult<{ success: boolean }>> =>
    apiPost<{ success: boolean }>('/settings/setup-wizard-v2'),
};
