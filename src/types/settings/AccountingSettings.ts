export interface AccountingSettings {
  id: number;
  taxEnabled: boolean;
  defaultTaxRate: number;
  taxRegistrationNumber: string | null;
  fiscalYearStartMonth: number;
  fiscalYearStartDay: number;
  autoPosting: boolean;
  costMethod: 'fifo' | 'lifo' | 'average';
  currencyCode: string;
  usdExchangeRate: number;
  roundingMethod: 'round' | 'ceil' | 'floor';
  updatedAt: string | null;
  updatedBy: number | null;
}
