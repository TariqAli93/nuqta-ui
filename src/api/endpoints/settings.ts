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
 * GET /settings/modules returns the full nested structure from GetModuleSettingsUseCase:
 * { modules, notifications, invoice, wizardCompleted }
 */
export interface AllModuleSettings {
  modules: ModuleSettings;
  notifications: NotificationSettings;
  invoice: InvoiceSettings;
  wizardCompleted: boolean;
}

/** @deprecated Use AllModuleSettings — kept for backward compat */
export type ModuleSettingsResponse = AllModuleSettings;

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
  getModules: (): Promise<ApiResult<AllModuleSettings>> =>
    apiGet<ModuleSettingsResponse>('/settings/modules'),

  /** POST /settings/setup-wizard — returns { completed: boolean } */
  completeWizard: (data: SetupWizardPayload): Promise<ApiResult<{ completed: boolean }>> =>
    apiPost<{ completed: boolean }>('/settings/setup-wizard', data),

  setModuleToggle: (key: string, value: boolean): Promise<ApiResult<null>> =>
    apiPut<null>(`/settings/${key}`, { value: String(value) }),

  // ── V2 settings endpoints ─────────────────────────────────────────

  /** GET /settings/system */
  getSystem: (): Promise<ApiResult<any>> =>
    apiGet<any>('/settings/system'),

  /** PUT /settings/system */
  updateSystem: (data: Record<string, unknown>): Promise<ApiResult<any>> =>
    apiPut<any>('/settings/system', data),

  /** GET /settings/accounting-v2 */
  getAccountingSettings: (): Promise<ApiResult<any>> =>
    apiGet<any>('/settings/accounting-v2'),

  /** PUT /settings/accounting-v2 */
  updateAccountingSettings: (data: Record<string, unknown>): Promise<ApiResult<any>> =>
    apiPut<any>('/settings/accounting-v2', data),

  /** GET /settings/pos */
  getPosSettings: (): Promise<ApiResult<any>> =>
    apiGet<any>('/settings/pos'),

  /** PUT /settings/pos */
  updatePosSettings: (data: Record<string, unknown>): Promise<ApiResult<any>> =>
    apiPut<any>('/settings/pos', data),

  /** GET /settings/barcode-config */
  getBarcodeSettings: (): Promise<ApiResult<any>> =>
    apiGet<any>('/settings/barcode-config'),

  /** PUT /settings/barcode-config */
  updateBarcodeSettings: (data: Record<string, unknown>): Promise<ApiResult<any>> =>
    apiPut<any>('/settings/barcode-config', data),

  /** POST /settings/setup-wizard-v2 */
  completeWizardV2: (data: Record<string, unknown>): Promise<ApiResult<any>> =>
    apiPost<any>('/settings/setup-wizard-v2', data),
};
