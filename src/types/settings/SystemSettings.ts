export interface SystemSettings {
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyPhone2: string | null;
  companyEmail: string | null;
  companyTaxId: string | null;
  companyLogo: string | null;
  defaultCurrency: 'IQD' | 'USD';
  lowStockThreshold: number;
  accountingEnabled: boolean;
  purchasesEnabled: boolean;
  ledgersEnabled: boolean;
  unitsEnabled: boolean;
  paymentsOnInvoicesEnabled: boolean;
  expiryAlertDays: number;
  debtReminderCount: number;
  debtReminderIntervalDays: number;
  setupWizardCompleted: boolean;
}
