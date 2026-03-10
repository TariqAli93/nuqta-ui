/**
 * Settings API endpoints.
 *
 * Replaces: ipc/settingsClient.ts
 */
import type { ApiResult } from '../contracts';
import type { SettingsCurrencyResponse, CompanySettings } from '../../types/domain';
import { apiGet, apiPut, apiPost, apiPatch } from '../http';

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
  showBarcode: boolean;
}

export interface AllModuleSettings {
  modules: ModuleSettings;
  notifications: NotificationSettings;
  invoice: InvoiceSettings;
  wizardCompleted: boolean;
}

interface SetupWizardPayload {
  modules: ModuleSettings;
  notifications: NotificationSettings;
  invoice: InvoiceSettings;
}

type TypedSettingValue = string | number | boolean;

export const settingsClient = {
  get: (key: string): Promise<ApiResult<string | null>> =>
    apiGet<string | null>(`/settings/${key}`),

  set: (key: string, value: string): Promise<ApiResult<{ ok: true }>> =>
    apiPut<{ ok: true }>(`/settings/${key}`, { value }),

  getTyped: async () => apiGet('/settings/accounting'),

  setTyped: async (values: Record<string, TypedSettingValue>): Promise<ApiResult<{ ok: true }>> => {
    for (const [key, value] of Object.entries(values)) {
      const result = await apiPut<{ ok: true }>(`/settings/${key}`, { value });
      if (!result.ok) return result;
    }
    return { ok: true as const, data: { ok: true as const } };
  },

  getCurrency: (): Promise<ApiResult<SettingsCurrencyResponse>> =>
    apiGet<SettingsCurrencyResponse>('/settings/currency'),

  getCompany: (): Promise<ApiResult<CompanySettings | null>> =>
    apiGet<CompanySettings | null>('/settings/company'),

  setCompany: (settings: CompanySettings): Promise<ApiResult<{ ok: true }>> =>
    apiPut<{ ok: true }>('/settings/company', settings),

  getAppVersion: (): Promise<ApiResult<{ version: string }>> =>
    apiGet<{ version: string }>('/system/capabilities'),

  /** No-op for printers in web mode — desktop-only feature */
  getPrinters: (): Promise<ApiResult<{ printers: string[] }>> =>
    Promise.resolve({ ok: true as const, data: { printers: [] } }),

  getModules: (): Promise<ApiResult<AllModuleSettings>> =>
    apiGet<AllModuleSettings>('/settings/modules'),

  completeWizard: (data: SetupWizardPayload): Promise<ApiResult<AllModuleSettings>> =>
    apiPost<AllModuleSettings>('/settings/setup-wizard', data),

  setModuleToggle: (key: string, value: boolean): Promise<ApiResult<AllModuleSettings>> =>
    apiPut<AllModuleSettings>(`/settings/${key}`, { value }),
};
