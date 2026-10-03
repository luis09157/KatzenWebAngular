import { omitUndefinedRtdb } from '../core/utils/omit-undefined-rtdb.util';
import { VisitaLinea } from './visitas.models';

/**
 * Línea lista para RTDB: sin `undefined`/`null` en claves opcionales
 * (`citaId`, `banioId`, `pensionId`, etc.). Spec 091 follow-up.
 */
export function sanitizeVisitaLineaForRtdb(linea: VisitaLinea): VisitaLinea {
  const raw = linea as unknown as Record<string, unknown>;
  const withoutNull: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined && v !== null) withoutNull[k] = v;
  }
  return omitUndefinedRtdb(withoutNull) as unknown as VisitaLinea;
}

export function sanitizeVisitaLineasForRtdb(lineas: VisitaLinea[] | null | undefined): VisitaLinea[] {
  return (lineas || []).map(sanitizeVisitaLineaForRtdb);
}
