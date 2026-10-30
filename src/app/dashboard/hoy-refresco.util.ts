/**
 * 2026-10-30 — la pantalla Hoy ya escucha en vivo baños, citas y tickets. Esto cubre lo que no:
 * - cambio de día (tablet abierta toda la noche) → recargar para que «hoy» sea hoy;
 * - «Para avisar hoy» se cuenta una vez → volver a contar si pasó un rato.
 */
import { hoyLocalIsoDate } from '../core/utils/periodo-filtro.util';

export const MINUTOS_RECONTAR_AVISOS = 10;

export interface RefrescoHoy {
  recargarPagina: boolean;
  recontarAvisos: boolean;
}

export function refrescoHoy(diaMostrado: string, ultimoConteoMs: number, ahora: Date = new Date()): RefrescoHoy {
  if (hoyLocalIsoDate(ahora) !== diaMostrado) return { recargarPagina: true, recontarAvisos: false };
  return {
    recargarPagina: false,
    recontarAvisos: ahora.getTime() - ultimoConteoMs >= MINUTOS_RECONTAR_AVISOS * 60_000,
  };
}
