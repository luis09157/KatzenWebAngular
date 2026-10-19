/**
 * Spec 085 B.1 — listado `/admin/banios`:
 * sin búsqueda → Hoy + Mañana (ISO local);
 * al buscar → historial (cliente / paciente / tipo / fecha).
 *
 * Núcleo genérico: `core/utils/listado-hoy-manana.util.ts`.
 */

import {
  coincidenciaTextoListado,
  fechaMananaLocal,
  filtrarFilasPorFechaIso,
  filtrarListadoAgendaOBusqueda,
  listadoFechaIso,
  metaListadoHoyManana,
  partirListadoHoyManana,
} from '../core/utils/listado-hoy-manana.util';

/** Fila ya hidratada para tabla (nombres resueltos + fecha ISO cruda). */
export interface BanioListadoFila {
  fecha_banio_iso?: string;
  fecha_banio?: string;
  hora_banio?: string;
  paciente?: string;
  cliente?: string;
  tipo_servicio?: string;
  tipo_servicio_texto?: string;
  estado?: string;
  estado_texto?: string;
  peluquero?: string;
  [key: string]: unknown;
}

export interface FiltrarBaniosListadoOpts {
  /** Texto del buscador; vacío = hoy + mañana. */
  query?: string | null;
  /** ISO local `YYYY-MM-DD`. */
  hoyIso?: string;
  mananaIso?: string;
  now?: Date;
}

export interface BaniosHoyManana<T extends BanioListadoFila = BanioListadoFila> {
  hoy: T[];
  manana: T[];
  hoyIso: string;
  mananaIso: string;
}

export { fechaMananaLocal, metaListadoHoyManana as metaBaniosListado };

/** ISO `YYYY-MM-DD` desde fecha de baño o created_at. */
export function banioFechaIso(raw: string | undefined | null, fallback?: string | null): string {
  return listadoFechaIso(raw, fallback);
}

export function filtrarBaniosPorFechaIso<T extends BanioListadoFila>(
  filas: T[] | null | undefined,
  fechaIso: string
): T[] {
  return filtrarFilasPorFechaIso(filas, fechaIso, (f) => [f.fecha_banio_iso]);
}

/** Parte filas en Hoy y Mañana (ISO local). */
export function partirBaniosHoyManana<T extends BanioListadoFila>(
  filas: T[] | null | undefined,
  opts: FiltrarBaniosListadoOpts = {}
): BaniosHoyManana<T> {
  return partirListadoHoyManana(filas, (f) => [f.fecha_banio_iso], opts);
}

/**
 * Sin query → hoy + mañana (hoy primero).
 * Con query → historial completo filtrado por paciente, cliente, tipo, fecha, estado, peluquero.
 */
export function filtrarBaniosListado<T extends BanioListadoFila>(
  filas: T[] | null | undefined,
  opts: FiltrarBaniosListadoOpts = {}
): T[] {
  return filtrarListadoAgendaOBusqueda(filas, {
    ...opts,
    getFechasIso: (f) => [f.fecha_banio_iso],
    coincideBusqueda: (f, q) => banioListadoCoincideBusqueda(f, q),
  });
}

export function banioListadoCoincideBusqueda(fila: BanioListadoFila, queryLower: string): boolean {
  return coincidenciaTextoListado(
    [
      fila.paciente,
      fila.cliente,
      fila.tipo_servicio,
      fila.tipo_servicio_texto,
      fila.estado,
      fila.estado_texto,
      fila.peluquero,
      fila.fecha_banio,
      fila.fecha_banio_iso,
      fila.hora_banio,
    ],
    queryLower
  );
}
