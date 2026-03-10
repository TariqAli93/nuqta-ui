export interface SystemSettings {
  companyName: string;
  companyNameAr: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  defaultCurrency: 'IQD' | 'USD';
  lowStockThreshold: number;
  enabledModules: {
    pos: boolean;
    inventory: boolean;
    accounting: boolean;
    installments: boolean;
  };
  notifications: {
    lowStock: boolean;
    dailyReport: boolean;
    installmentDue: boolean;
  };
  setupWizardCompleted: boolean;
}
