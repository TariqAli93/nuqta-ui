/**
 * Composable for exporting report data to CSV and printing.
 */
export function useExportReport() {
  /**
   * Export data array to a CSV file and trigger browser download.
   * @param data - Array of objects to export
   * @param filename - Filename without extension
   * @param headers - Map of data keys to column header labels
   */
  function exportToCSV(
    data: Record<string, unknown>[],
    filename: string,
    headers: Record<string, string>
  ): void {
    const keys = Object.keys(headers);
    const headerRow = keys.map((k) => headers[k]);

    const rows = data.map((row) =>
      keys.map((k) => {
        const val = row[k];
        if (val == null) return '';
        const str = String(val);
        // Escape CSV values that contain commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
    );

    // Add BOM for proper Arabic display in Excel
    const bom = '\uFEFF';
    const csv = bom + [headerRow.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Print a specific element on the page by its ID.
   * @param elementId - The DOM element ID to print
   */
  function printReport(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>طباعة التقرير</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: right; font-size: 13px; }
          th { background: #f5f5f5; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return { exportToCSV, printReport };
}
