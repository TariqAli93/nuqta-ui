/**
 * Settings API endpoints.
 *
 * Replaces: ipc/settingsClient.ts
 */
import type { ApiResult } from '../contracts';
import type { CompanySettings } from '../../types/domain';
import { apiGet, apiPut, apiPost } from '../http';

export interface ModuleSettings {
  accountingEnabled: boolean;
  purchasesEnabled: boolean;
  ledgersEnabled: boolean;
  unitsEnabled: boolean;
  paymentsOnInvoicesEnabled: boolean;
}

export interface NotificationSettings {
  lowStockThreshold: number;
  expiryDays: number;
  debtReminderCount: number;
  debtReminderIntervalDays: number;
}

export interface InvoiceSettings {
  templateActiveId: string;
  prefix: string;
  paperSize: 'thermal' | 'a4' | 'a5';
  logo: string;
  footerNotes: string;
  layoutDirection: 'rtl' | 'ltr';
  showQr: boolean;
}

/**
 * GET /settings/modules returns ModuleSettings directly (not wrapped in { modules, ... }).
 */
export type ModuleSettingsResponse = ModuleSettings;

interface SetupWizardPayload {
  modules?: Partial<ModuleSettings>;
  notifications?: Partial<NotificationSettings>;
  invoice?: Partial<InvoiceSettings>;
}

/** Backend returns { id, currencyCode, currencyName, symbol, exchangeRate, isBaseCurrency, isActive, updatedAt } */
export interface CurrencySettingsResponse {
  id?: number;
  currencyCode: string;
  currencyName?: string;
  symbol?: string;
  exchangeRate?: number;
  isBaseCurrency?: boolean;
  isActive?: boolean;
  updatedAt?: string | null;
}

type TypedSettingValue = string | number | boolean;
type TypedSettingsRecord<K extends string> = Partial<Record<K, TypedSettingValue>>;

export const settingsClient = {
  get: (key: string): Promise<ApiResult<string | null>> =>
    apiGet<string | null>(`/settings/${key}`),

  set: (key: string, value: TypedSettingValue): Promise<ApiResult<null>> =>
    apiPut<null>(`/settings/${key}`, { value: String(value) }),

  getTyped: async <K extends string>(
    keys: readonly K[]
  ): Promise<ApiResult<TypedSettingsRecord<K>>> => {
    const values: TypedSettingsRecord<K> = {};

    for (const key of keys) {
      const result = await apiGet<TypedSettingValue | null>(`/settings/${key}`);
      if (!result.ok) {
        return result as ApiResult<TypedSettingsRecord<K>>;
      }
      if (result.data != null) {
        values[key] = result.data;
      }
    }

    return { ok: true as const, data: values };
  },

  setTyped: async (values: Record<string, TypedSettingValue>): Promise<ApiResult<null>> => {
    for (const [key, value] of Object.entries(values)) {
      const result = await apiPut<null>(`/settings/${key}`, { value: String(value) });
      if (!result.ok) return result;
    }
    return { ok: true as const, data: null };
  },

  getCurrency: (): Promise<ApiResult<CurrencySettingsResponse>> =>
    apiGet<CurrencySettingsResponse>('/settings/currency'),

  getCompany: (): Promise<ApiResult<CompanySettings | null>> =>
    apiGet<CompanySettings | null>('/settings/company'),

  setCompany: (settings: CompanySettings): Promise<ApiResult<CompanySettings>> =>
    apiPut<CompanySettings>('/settings/company', settings),

  getAppVersion: (): Promise<ApiResult<{ version: string }>> =>
    apiGet<{ version: string }>('/system/capabilities'),

  getPrinters: (): Promise<ApiResult<{ printers: string[] }>> =>
    Promise.resolve({ ok: true as const, data: { printers: [] } }),

  /** GET /settings/modules — returns ModuleSettings directly */
  getModules: (): Promise<ApiResult<ModuleSettingsResponse>> =>
    apiGet<ModuleSettingsResponse>('/settings/modules'),

  /** POST /settings/setup-wizard — returns { completed: boolean } */
  completeWizard: (data: SetupWizardPayload): Promise<ApiResult<{ completed: boolean }>> =>
    apiPost<{ completed: boolean }>('/settings/setup-wizard', data),

  setModuleToggle: (key: string, value: boolean): Promise<ApiResult<null>> =>
    apiPut<null>(`/settings/${key}`, { value: String(value) }),
};
