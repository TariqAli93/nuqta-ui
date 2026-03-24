export function stripNonDigits(value: string | number | null): string {
  if (value === null) return '0';
  const normalized = String(value).replace(/[^\d]/g, '');
  const parsed = parseInt(normalized, 10);
  return (Number.isFinite(parsed) ? Math.max(0, parsed) : 0).toString();
}

export function toInputAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) return '';
  return String(value);
}
