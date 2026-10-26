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

  // Ya viene en dd/mm/aaaa (listado). `new Date('01/10/2026')` lo lee como mes/día y lo voltea.
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const day = +dmy[1];
    const month = +dmy[2];
    const year = +dmy[3];
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return toDisplayEs(year, month, day);
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

/**
 * Fecha tecleada en un campo de fecha → Date local (12:00) o null (2026-10-26).
 * Acepta `dd/mm/aaaa`, `d/m/aa`, `dd-mm-aaaa`, `dd.mm.aaaa` y `aaaa-mm-dd`.
 * Antes el adaptador nativo usaba `Date.parse`: «02/10/2026» se guardaba como 10 de febrero.
 */
export function parseFechaTecleada(value: unknown): Date | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  let y: number;
  let m: number;
  let d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(s);
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (dmy) {
    d = Number(dmy[1]);
    m = Number(dmy[2]);
    y = Number(dmy[3]);
    if (dmy[3].length === 2) y += 2000;
  } else {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  // 31/02 → no existe (Date lo pasaría a marzo).
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}
