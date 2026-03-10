export interface PosSettings {
  invoicePrefix: string;
  nextInvoiceNumber: number;
  paperSize: 'A4' | 'A5' | '80mm' | '58mm';
  layoutDirection: 'rtl' | 'ltr';
  showQrCode: boolean;
  showBarcode: boolean;
  printerType: 'thermal' | 'laser' | 'inkjet';
  receiptHeader: string;
  receiptFooter: string;
  autoPrint: boolean;
  showLogo: boolean;
}
