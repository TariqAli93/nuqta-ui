export interface PosSettings {
  invoicePrefix: string;
  nextInvoiceNumber: number;
  paperSize: 'A4' | 'A5' | 'thermal';
  layoutDirection: 'rtl' | 'ltr';
  printerType: 'thermal' | 'laser' | 'inkjet';
  receiptHeader: string;
  receiptFooter: string;
  autoPrint: boolean;
  showLogo: boolean;
}
