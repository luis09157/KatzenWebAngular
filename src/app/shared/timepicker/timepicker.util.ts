/** Utilidades de hora para el timepicker Katzen (valor HH:mm 24h ↔ display 12h). */

export type PeriodoAmPm = 'am' | 'pm';

export interface TimeParts12h {
  hour12: number; // 1–12
  minute: number; // 0–59
  period: PeriodoAmPm;
}

const HH_MM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** True si el string es HH:mm válido (24h). */
export function isValidHhMm(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return HH_MM.test(value.trim());
}

/** Parsea "HH:mm" a partes 12h. Null si inválido. */
export function parseHhMm(value: string | null | undefined): TimeParts12h | null {
  if (!isValidHhMm(value)) return null;
  const [hStr, mStr] = value!.trim().split(':');
  const hour24 = Number(hStr);
  const minute = Number(mStr);
  const period: PeriodoAmPm = hour24 >= 12 ? 'pm' : 'am';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
}

/** Combina partes 12h a "HH:mm" 24h. */
export function toHhMm(parts: TimeParts12h): string {
  let hour24 = parts.hour12 % 12;
  if (parts.period === 'pm') hour24 += 12;
  const hh = String(hour24).padStart(2, '0');
  const mm = String(Math.min(59, Math.max(0, parts.minute))).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Display español latino: "04:01 p.m." / "12:00 a.m."
 * Vacío si el valor no es HH:mm válido.
 */
export function formatHhMmDisplay(value: string | null | undefined): string {
  const parts = parseHhMm(value);
  if (!parts) return '';
  const hh = String(parts.hour12).padStart(2, '0');
  const mm = String(parts.minute).padStart(2, '0');
  const suffix = parts.period === 'am' ? 'a.m.' : 'p.m.';
  return `${hh}:${mm} ${suffix}`;
}

/** Genera lista de minutos según paso (1–30). */
export function buildMinuteOptions(step = 1): number[] {
  const safe = Math.min(30, Math.max(1, Math.floor(step)));
  const out: number[] = [];
  for (let m = 0; m < 60; m += safe) {
    out.push(m);
  }
  return out;
}

export const HOUR12_OPTIONS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
