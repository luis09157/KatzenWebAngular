/**
 * Spec 071 — folio de ticket de visita (aditivo).
 * Formato: KV-YYYYMMDD-NNN (secuencia del día, no el UUID).
 */

const FOLIO_RE = /^KV-(\d{8})-(\d{1,4})$/i;

export function ymdDesdeFechaIso(fecha: string | null | undefined): string {
  const f = String(fecha || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f);
  if (!m) return '';
  return `${m[1]}${m[2]}${m[3]}`;
}

export function siguienteFolioTicketDia(
  fecha: string,
  foliosExistentes: Array<string | null | undefined> | null | undefined
): string {
  const ymd = ymdDesdeFechaIso(fecha);
  if (!ymd) return '';
  const prefix = `KV-${ymd}-`;
  let max = 0;
  for (const raw of foliosExistentes || []) {
    const f = String(raw || '').trim();
    const m = FOLIO_RE.exec(f);
    if (!m || m[1] !== ymd) continue;
    const n = parseInt(m[2], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/** Folio persistido o vacío (el WhatsApp/print cae al folio corto del id). */
export function folioVisibleTicket(folio: string | null | undefined): string {
  return String(folio || '').trim();
}
