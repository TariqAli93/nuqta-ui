export interface AccountingSettings {
  taxEnabled: boolean;
  taxRate: number;
  taxName: string;
  taxReportFrequency: 'monthly' | 'quarterly' | 'annually';
  taxReportEmail: string;
  taxReportTemplate: string;
  taxReportIncludeDetails: boolean;
  taxReportIncludeSummary: boolean;
  fiscalYearStart: string; // MM-DD
  costingMethod: 'FIFO' | 'LIFO' | 'AVERAGE';
  exchangeRate: number; // USD to IQD
  roundingMode: 'up' | 'down' | 'nearest';
  roundingPrecision: number;
}
