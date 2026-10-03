/**
 * Fechas canónicas admin: ISO `yyyy-MM-dd` en formularios/RTDB;
 * UI con Material datepicker (locale es-MX → dd/mm/aaaa). Spec 090.
 */

export function parseIsoDateToLocalDate(iso: string | null | undefined): Date | null {
  const s = String(iso || '')
    .trim()
    .slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map((n) => Number(n));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalDateToIso(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Acepta ISO, Date o string parseable; devuelve ISO o ''. */
export function coerceToIsoDate(value: unknown): string {
  if (value == null || value === '') return '';
  if (value instanceof Date) return formatLocalDateToIso(value);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return formatLocalDateToIso(parsed);
  return '';
}
