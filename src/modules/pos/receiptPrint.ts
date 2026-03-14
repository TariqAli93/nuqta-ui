import type { CompanySettings, Sale, SaleItem } from '@/types/domain';
import type { PosSettings } from '@/types/settings/PosSettings';
import type { SystemSettings } from '@/types/settings/SystemSettings';

type ReceiptDirection = 'rtl' | 'ltr';

type ReceiptLabels = {
  receiptTitle: string;
  invoiceNumber: string;
  dateTime: string;
  cashier: string;
  branch: string;
  customer: string;
  item: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  notes: string;
  thankYou: string;
  generatedElectronically: string;
  fallbackTitle: string;
};

export interface ReceiptPrintData {
  invoiceNumber: string;
  createdAt?: string | null;
  cashierName?: string | null;
  customerName?: string | null;
  branchName?: string | null;
  notes?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  companyName: string;
  companyNameAr?: string | null;
  phone?: string | null;
  phone2?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  showLogo?: boolean;
  receiptWidth?: string | null;
  receiptHeader?: string | null;
  footerNote?: string | null;
  direction?: ReceiptDirection;
  fallbackText?: string | null;
}

export interface ReceiptPrintOptions {
  sale: Sale;
  customerName?: string | null;
  cashierName?: string | null;
  companySettings?: CompanySettings | null;
  systemSettings?: Partial<SystemSettings> | null;
  posSettings?: Partial<PosSettings> | null;
  fallbackText?: string | null;
}

const DEFAULT_RECEIPT_WIDTH = '80mm';
const CSS_LENGTH_RE = /^\d+(?:\.\d+)?(?:px|mm|cm|in|pt|pc|q|rem|em|vw|vh|vmin|vmax|%)$/i;
const NUMERIC_RE = /^\d+(?:\.\d+)?$/;

export function normalizeReceiptWidth(value?: string | null): string {
  const normalized = value?.trim();
  if (!normalized) return DEFAULT_RECEIPT_WIDTH;

  const lower = normalized.toLowerCase();

  if (lower === '58mm') return '58mm';
  if (lower === '80mm') return '80mm';
  if (lower === 'a4') return '210mm';
  if (lower === 'a5') return '148mm';
  if (CSS_LENGTH_RE.test(lower)) return lower;
  if (NUMERIC_RE.test(lower)) return `${lower}mm`;

  return DEFAULT_RECEIPT_WIDTH;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatReceiptDate(
  value?: string | null,
  direction: ReceiptDirection = 'rtl'
): string {
  const date = value ? new Date(value) : new Date();
  const locale = direction === 'rtl' ? 'ar-IQ' : 'en-US';

  if (Number.isNaN(date.getTime())) {
    return value ?? '';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatReceiptMoney(
  value: number,
  currency: string,
  direction: ReceiptDirection = 'rtl'
): string {
  const locale = direction === 'rtl' ? 'ar-IQ' : 'en-US';
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

  return `${formattedNumber} ${escapeHtml(currency)}`;
}

function formatQuantity(value: number, direction: ReceiptDirection): string {
  return new Intl.NumberFormat(direction === 'rtl' ? 'ar-IQ' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(value) ? value : 0);
}

function cleanText(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readLooseString(source: unknown, ...keys: string[]): string | undefined {
  if (!source || typeof source !== 'object') return undefined;

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return undefined;
}

function readLooseBoolean(source: unknown, ...keys: string[]): boolean | undefined {
  if (!source || typeof source !== 'object') return undefined;

  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }

  return undefined;
}

function containsArabic(value?: string | null): boolean {
  return /[\u0600-\u06FF]/.test(value ?? '');
}

function getDirection(options: ReceiptPrintOptions): ReceiptDirection {
  const explicitDirection =
    options.posSettings?.layoutDirection ??
    (readLooseString(options.posSettings, 'layoutDirection') as ReceiptDirection | undefined) ??
    (readLooseString(options.systemSettings, 'layoutDirection') as ReceiptDirection | undefined);

  if (explicitDirection === 'rtl' || explicitDirection === 'ltr') {
    return explicitDirection;
  }

  if (containsArabic(options.companySettings?.name)) {
    return 'rtl';
  }

  return 'ltr';
}

function getLabels(direction: ReceiptDirection): ReceiptLabels {
  if (direction === 'rtl') {
    return {
      receiptTitle: 'إيصال البيع',
      invoiceNumber: 'رقم الفاتورة',
      dateTime: 'التاريخ',
      cashier: 'الكاشير',
      branch: 'الفرع',
      customer: 'العميل',
      item: 'الصنف',
      quantity: 'الكمية',
      unitPrice: 'سعر الوحدة',
      lineTotal: 'الإجمالي',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      tax: 'الضريبة',
      total: 'الإجمالي النهائي',
      notes: 'ملاحظات',
      thankYou: 'شكرا لتسوقكم معنا',
      generatedElectronically: 'تم إنشاء هذا الإيصال إلكترونيا',
      fallbackTitle: 'الإيصال النصي',
    };
  }

  return {
    receiptTitle: 'Sales Receipt',
    invoiceNumber: 'Invoice No.',
    dateTime: 'Date',
    cashier: 'Cashier',
    branch: 'Branch',
    customer: 'Customer',
    item: 'Item',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    lineTotal: 'Line Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    total: 'Grand Total',
    notes: 'Notes',
    thankYou: 'Thank you for your visit',
    generatedElectronically: 'Generated electronically',
    fallbackTitle: 'Legacy Receipt',
  };
}

function buildMetadataRows(
  data: ReceiptPrintData,
  labels: ReceiptLabels,
  direction: ReceiptDirection
): string {
  const rows = [
    { label: labels.invoiceNumber, value: data.invoiceNumber },
    { label: labels.dateTime, value: formatReceiptDate(data.createdAt, direction) },
    { label: labels.cashier, value: cleanText(data.cashierName) },
    { label: labels.branch, value: cleanText(data.branchName) },
    { label: labels.customer, value: cleanText(data.customerName) },
  ].filter((row) => row.value);

  return rows
    .map(
      (row) => `
        <div class="meta-row">
          <span class="meta-label">${escapeHtml(row.label)}</span>
          <span class="meta-value">${escapeHtml(row.value ?? '')}</span>
        </div>
      `
    )
    .join('');
}

function buildItemsMarkup(
  data: ReceiptPrintData,
  labels: ReceiptLabels,
  direction: ReceiptDirection
): string {
  return data.items
    .map((item, index) => {
      const itemName = cleanText(item.productName) ?? `${labels.item} ${index + 1}`;
      const unitName = cleanText(item.unitName);
      const quantity = formatQuantity(item.quantity, direction);
      const unitPrice = formatReceiptMoney(item.unitPrice, data.currency, direction);
      const subtotal = formatReceiptMoney(item.subtotal, data.currency, direction);
      const quantityText = unitName ? `${quantity} ${escapeHtml(unitName)}` : quantity;

      return `
        <article class="item-card">
          <div class="item-head">
            <span class="item-index">${escapeHtml(String(index + 1).padStart(2, '0'))}</span>
            <div class="item-name-wrap">
              <div class="item-name">${escapeHtml(itemName)}</div>
            </div>
            <div class="item-total">${subtotal}</div>
          </div>
          <div class="item-metrics">
            <div class="metric">
              <span class="metric-label">${escapeHtml(labels.quantity)}</span>
              <span class="metric-value">${quantityText}</span>
            </div>
            <div class="metric">
              <span class="metric-label">${escapeHtml(labels.unitPrice)}</span>
              <span class="metric-value">${unitPrice}</span>
            </div>
            <div class="metric">
              <span class="metric-label">${escapeHtml(labels.lineTotal)}</span>
              <span class="metric-value">${subtotal}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function buildTotalsMarkup(
  data: ReceiptPrintData,
  labels: ReceiptLabels,
  direction: ReceiptDirection
): string {
  const rows = [
    { label: labels.subtotal, value: data.subtotal, emphasized: false, visible: true },
    { label: labels.discount, value: data.discount, emphasized: false, visible: data.discount > 0 },
    { label: labels.tax, value: data.tax, emphasized: false, visible: data.tax > 0 },
    { label: labels.total, value: data.total, emphasized: true, visible: true },
  ].filter((row) => row.visible);

  return rows
    .map(
      (row) => `
        <div class="total-row${row.emphasized ? ' is-grand' : ''}">
          <span>${escapeHtml(row.label)}</span>
          <strong>${formatReceiptMoney(row.value, data.currency, direction)}</strong>
        </div>
      `
    )
    .join('');
}

function buildPhonesMarkup(data: ReceiptPrintData): string {
  return [cleanText(data.phone), cleanText(data.phone2)]
    .filter(Boolean)
    .map((phone) => `<div class="company-subline">${escapeHtml(phone ?? '')}</div>`)
    .join('');
}

function buildFallbackMarkup(data: ReceiptPrintData, labels: ReceiptLabels): string {
  if (data.items.length > 0 || !cleanText(data.fallbackText)) {
    return '';
  }

  return `
    <section class="section legacy-section">
      <div class="section-title">${escapeHtml(labels.fallbackTitle)}</div>
      <pre class="legacy-receipt">${escapeHtml(data.fallbackText ?? '')}</pre>
    </section>
  `;
}

export function createReceiptPrintData(options: ReceiptPrintOptions): ReceiptPrintData {
  const direction = getDirection(options);
  const saleItems = Array.isArray(options.sale.items) ? options.sale.items : [];
  const companyName =
    cleanText(options.companySettings?.name) ??
    cleanText(options.systemSettings?.companyName) ??
    'Store';

  const receiptWidth =
    readLooseString(options.posSettings, 'receiptWidth') ??
    cleanText(options.posSettings?.paperSize) ??
    readLooseString(options.systemSettings, 'receiptWidth', 'paperSize');

  return {
    invoiceNumber: cleanText(options.sale.invoiceNumber) ?? 'N/A',
    createdAt: options.sale.createdAt ?? new Date().toISOString(),
    cashierName: cleanText(options.cashierName),
    customerName: cleanText(options.customerName),
    branchName:
      readLooseString(options.systemSettings, 'branchName', 'storeName') ??
      readLooseString(options.posSettings, 'branchName') ??
      undefined,
    notes: cleanText(options.sale.notes),
    items: saleItems,
    subtotal: options.sale.subtotal ?? 0,
    discount: options.sale.discount ?? 0,
    tax: options.sale.tax ?? 0,
    total: options.sale.total ?? 0,
    currency:
      cleanText(options.sale.currency) ??
      cleanText(options.companySettings?.currency) ??
      cleanText(options.systemSettings?.defaultCurrency) ??
      'IQD',
    companyName,
    companyNameAr: readLooseString(options.companySettings, 'nameAr', 'companyNameAr') ?? undefined,
    phone:
      cleanText(options.companySettings?.phone) ??
      cleanText(options.systemSettings?.companyPhone) ??
      undefined,
    phone2:
      cleanText(options.companySettings?.phone2) ??
      cleanText(options.systemSettings?.companyPhone2) ??
      undefined,
    address:
      cleanText(options.companySettings?.address) ??
      cleanText(options.systemSettings?.companyAddress) ??
      undefined,
    logoUrl:
      cleanText(options.companySettings?.logo) ??
      cleanText(options.systemSettings?.companyLogo) ??
      undefined,
    showLogo:
      options.posSettings?.showLogo ?? readLooseBoolean(options.posSettings, 'showLogo') ?? false,
    receiptWidth: normalizeReceiptWidth(receiptWidth),
    receiptHeader: cleanText(options.posSettings?.receiptHeader),
    footerNote:
      cleanText(options.posSettings?.receiptFooter) ??
      readLooseString(options.systemSettings, 'footerNotes', 'footerNote', 'returnPolicy') ??
      undefined,
    direction,
    fallbackText: cleanText(options.fallbackText),
  };
}

export function renderReceiptHtml(data: ReceiptPrintData): string {
  const direction = data.direction ?? 'rtl';
  const labels = getLabels(direction);
  const lang = direction === 'rtl' ? 'ar' : 'en';
  const metadataMarkup = buildMetadataRows(data, labels, direction);
  const itemsMarkup = buildItemsMarkup(data, labels, direction);
  const totalsMarkup = buildTotalsMarkup(data, labels, direction);
  const phonesMarkup = buildPhonesMarkup(data);
  const fallbackMarkup = buildFallbackMarkup(data, labels);
  const headerText = cleanText(data.receiptHeader);
  const footerText = cleanText(data.footerNote);
  const addressText = cleanText(data.address);
  const notesText = cleanText(data.notes);
  const companyNameAr = cleanText(data.companyNameAr);
  const showLogo = Boolean(data.showLogo && data.logoUrl);
  const width = normalizeReceiptWidth(data.receiptWidth);

  return `
    <!doctype html>
    <html lang="${lang}" dir="${direction}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(`${labels.receiptTitle} ${data.invoiceNumber}`)}</title>
        <style>
          :root {
            color-scheme: light;
            --receipt-width: ${width};
            --page-margin: 6mm 4mm 8mm;
            --text: #111827;
            --muted: #6b7280;
            --line: #e5e7eb;
            --line-strong: #d1d5db;
            --surface: #ffffff;
            --surface-soft: #f8fafc;
            --accent: #0f766e;
            --accent-soft: rgba(15, 118, 110, 0.08);
            --font: "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #eef2f7;
            color: var(--text);
            font-family: var(--font);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            display: flex;
            justify-content: center;
            padding: 16px;
          }

          .receipt-shell {
            width: min(100%, var(--receipt-width));
          }

          .receipt {
            width: 100%;
            background: var(--surface);
            border: 1px solid rgba(209, 213, 219, 0.9);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
          }

          .receipt-topbar {
            height: 8px;
            background: linear-gradient(90deg, #0f766e 0%, #14b8a6 100%);
          }

          .receipt-inner {
            padding: 18px 16px 16px;
          }

          .header {
            text-align: center;
            padding-bottom: 16px;
            border-bottom: 1px dashed var(--line-strong);
          }

          .logo {
            width: 54px;
            height: 54px;
            object-fit: contain;
            margin: 0 auto 10px;
            display: block;
          }

          .company-name {
            margin: 0;
            font-size: 1.3rem;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .company-name-ar {
            margin: 6px 0 0;
            font-size: 0.98rem;
            color: var(--muted);
            font-weight: 600;
          }

          .header-note {
            margin-top: 10px;
            padding: 8px 10px;
            border-radius: 12px;
            background: var(--accent-soft);
            color: var(--accent);
            font-size: 0.82rem;
            font-weight: 700;
          }

          .company-subline {
            margin-top: 6px;
            color: var(--muted);
            font-size: 0.86rem;
            line-height: 1.5;
          }

          .section {
            margin-top: 14px;
          }

          .section-title {
            margin: 0 0 10px;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
          }

          .meta-grid {
            display: grid;
            gap: 8px;
          }

          .meta-row {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px;
            padding: 0 0 8px;
            border-bottom: 1px solid var(--line);
          }

          .meta-row:last-child {
            padding-bottom: 0;
            border-bottom: 0;
          }

          .meta-label {
            color: var(--muted);
            font-size: 0.8rem;
          }

          .meta-value {
            font-size: 0.84rem;
            font-weight: 700;
            text-align: end;
            word-break: break-word;
          }

          .items-list {
            display: grid;
            gap: 10px;
          }

          .item-card {
            border: 1px solid var(--line);
            border-radius: 16px;
            background: var(--surface-soft);
            padding: 10px 12px;
          }

          .item-head {
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: 10px;
            align-items: start;
          }

          .item-index {
            min-width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.06);
            font-size: 0.72rem;
            font-weight: 800;
          }

          .item-name {
            font-size: 0.9rem;
            font-weight: 700;
            line-height: 1.45;
            word-break: break-word;
          }

          .item-total {
            font-size: 0.84rem;
            font-weight: 800;
            white-space: nowrap;
            text-align: end;
          }

          .item-metrics {
            margin-top: 10px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }

          .metric {
            padding: 8px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid rgba(229, 231, 235, 0.92);
          }

          .metric-label {
            display: block;
            color: var(--muted);
            font-size: 0.68rem;
            margin-bottom: 4px;
          }

          .metric-value {
            display: block;
            font-size: 0.78rem;
            font-weight: 700;
            line-height: 1.35;
            word-break: break-word;
          }

          .totals {
            padding: 12px;
            border-radius: 18px;
            background: linear-gradient(180deg, rgba(15, 118, 110, 0.08) 0%, rgba(15, 118, 110, 0.03) 100%);
            border: 1px solid rgba(15, 118, 110, 0.14);
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 6px 0;
            font-size: 0.86rem;
          }

          .total-row.is-grand {
            margin-top: 6px;
            padding-top: 10px;
            border-top: 1px dashed rgba(15, 118, 110, 0.28);
            color: var(--accent);
            font-size: 1rem;
          }

          .note-box,
          .footer-box,
          .legacy-section {
            padding: 12px;
            border-radius: 16px;
            border: 1px solid var(--line);
            background: #ffffff;
          }

          .note-text,
          .footer-text {
            font-size: 0.82rem;
            line-height: 1.6;
            color: #374151;
            word-break: break-word;
          }

          .footer {
            margin-top: 16px;
            padding-top: 14px;
            border-top: 1px dashed var(--line-strong);
            text-align: center;
          }

          .footer-title {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 800;
          }

          .footer-caption {
            margin-top: 6px;
            color: var(--muted);
            font-size: 0.74rem;
          }

          .legacy-receipt {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: "Cascadia Mono", "Courier New", monospace;
            font-size: 0.78rem;
            line-height: 1.5;
          }

          @page {
            size: ${width} auto;
            margin: var(--page-margin);
          }

          @media (max-width: 420px) {
            body {
              padding: 8px;
            }

            .receipt-inner {
              padding-inline: 12px;
            }

            .item-metrics {
              grid-template-columns: 1fr;
            }
          }

          @media print {
            html,
            body {
              background: #ffffff;
            }

            body {
              display: block;
              padding: 0;
            }

            .receipt-shell {
              width: 100%;
              max-width: none;
            }

            .receipt {
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }

            .receipt-inner {
              padding: 0;
            }

            .item-card,
            .metric,
            .note-box,
            .footer-box,
            .totals,
            .legacy-section {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <main class="receipt-shell">
          <section class="receipt">
            <div class="receipt-topbar"></div>
            <div class="receipt-inner">
              <header class="header">
                ${showLogo ? `<img class="logo" src="${escapeHtml(data.logoUrl ?? '')}" alt="logo" />` : ''}
                <h1 class="company-name">${escapeHtml(data.companyName)}</h1>
                ${companyNameAr ? `<p class="company-name-ar">${escapeHtml(companyNameAr)}</p>` : ''}
                ${headerText ? `<div class="header-note">${escapeHtml(headerText)}</div>` : ''}
                ${phonesMarkup}
                ${addressText ? `<div class="company-subline">${escapeHtml(addressText)}</div>` : ''}
              </header>

              <section class="section">
                <div class="section-title">${escapeHtml(labels.receiptTitle)}</div>
                <div class="meta-grid">${metadataMarkup}</div>
              </section>

              ${
                data.items.length > 0
                  ? `
                <section class="section">
                  <div class="section-title">${escapeHtml(labels.item)}</div>
                  <div class="items-list">${itemsMarkup}</div>
                </section>

                <section class="section totals">${totalsMarkup}</section>
              `
                  : ''
              }

              ${
                notesText
                  ? `
                <section class="section note-box">
                  <div class="section-title">${escapeHtml(labels.notes)}</div>
                  <div class="note-text">${escapeHtml(notesText)}</div>
                </section>
              `
                  : ''
              }

              ${
                footerText
                  ? `
                <section class="section footer-box">
                  <div class="footer-text">${escapeHtml(footerText)}</div>
                </section>
              `
                  : ''
              }

              ${fallbackMarkup}

              <footer class="footer">
                <p class="footer-title">${escapeHtml(labels.thankYou)}</p>
                <div class="footer-caption">${escapeHtml(labels.generatedElectronically)}</div>
              </footer>
            </div>
          </section>
        </main>

        <script>
          (function () {
            let printed = false;

            function printNow() {
              if (printed) return;
              printed = true;
              window.setTimeout(function () {
                window.focus();
                window.print();
              }, 160);
            }

            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(printNow).catch(printNow);
            } else if (document.readyState === 'complete') {
              printNow();
            } else {
              window.addEventListener('load', printNow, { once: true });
            }

            window.setTimeout(printNow, 900);

            window.onafterprint = function () {
              window.close();
            };
          })();
        </script>
      </body>
    </html>
  `;
}

export function printReceiptModern(data: ReceiptPrintData): boolean {
  const printWindow = window.open('', '_blank', 'popup=yes,width=420,height=720');

  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(renderReceiptHtml(data));
  printWindow.document.close();

  return true;
}
