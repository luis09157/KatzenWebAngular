/**
 * Fechas canónicas admin: ISO `yyyy-MM-dd` en formularios/RTDB;
 * UI con Material datepicker (locale es-MX → dd/mm/aaaa). Spec 090.
 *
 * No usar `toISOString().slice(0, 10)` ni `new Date('yyyy-MM-dd')` para
 * fechas de calendario: en MX (UTC−6) suman/restan un día.
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

/**
 * Timestamp naive local `yyyy-MM-dd HH:mm:ss` para `created_at` / `updated_at`.
 * Evita el día UTC de `toISOString()` (noche MX → día siguiente).
 */
export function formatLocalDateTimeStamp(ref: Date = new Date()): string {
  if (!(ref instanceof Date) || Number.isNaN(ref.getTime())) return '';
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  const hh = String(ref.getHours()).padStart(2, '0');
  const mm = String(ref.getMinutes()).padStart(2, '0');
  const ss = String(ref.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
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

/**
 * UI `dd/mm/yyyy` sin desfase UTC.
 * - `yyyy-MM-dd` y `yyyy-MM-dd HH:mm:ss` (naive): día de calendario tal cual en storage.
 * - ISO con `T`/`Z`: convierte a zona local del navegador.
 */
export function formatearFechaLocalEs(value: unknown): string {
  if (value == null || value === '') return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return toDisplayEs(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  const s = String(value).trim();
  const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return toDisplayEs(+dateOnly[1], +dateOnly[2], +dateOnly[3]);
  }

  const naiveDt = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (naiveDt) {
    return toDisplayEs(+naiveDt[1], +naiveDt[2], +naiveDt[3]);
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return toDisplayEs(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return toDisplayEs(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }
  return '';
}

function toDisplayEs(y: number, m: number, d: number): string {
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
