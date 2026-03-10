export interface BarcodeSettings {
  barcodeType: 'CODE128' | 'EAN13' | 'EAN8' | 'QR' | 'UPC';
  width: number;
  height: number;
  dpi: number;
  labelWidth: number;
  labelHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  encoding: string;
  showText: boolean;
  prefix: string;
  autoGenerate: boolean;
}
