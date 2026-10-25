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
  lunes: T[];
  hoyIso: string;
  mananaIso: string;
  lunesIso: string;
  /** Viernes y sábado: el lunes todavía no es «mañana». */
  mostrarLunes: boolean;
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

/** Parte filas en Hoy, Mañana y, el viernes o sábado, el lunes que sigue. */
export function partirBaniosHoyManana<T extends BanioListadoFila>(
  filas: T[] | null | undefined,
  opts: FiltrarBaniosListadoOpts = {}
): BaniosHoyManana<T> {
  const now = opts.now || new Date();
  const base = partirListadoHoyManana(filas, (f) => [f.fecha_banio_iso], opts);
  const mostrarLunes = incluyeLunesEnAgendaBanios(now);
  const lunesIso = fechaLunesListadoBanios(now);
  const lunes = mostrarLunes
    ? filtrarBaniosPorFechaIso(filas, lunesIso).filter(
        (fila) => !base.hoy.includes(fila) && !base.manana.includes(fila)
      )
    : [];
  return { ...base, lunes, lunesIso, mostrarLunes };
}

/** Viernes y sábado. El domingo el lunes ya entra en Mañana. */
export function incluyeLunesEnAgendaBanios(ref: Date = new Date()): boolean {
  const dia = ref.getDay();
  return dia === 5 || dia === 6;
}

/** Próximo lunes en calendario local. Si hoy es lunes, el de la semana siguiente. */
export function fechaLunesListadoBanios(ref: Date = new Date()): string {
  const faltan = (8 - ref.getDay()) % 7 || 7;
  const lunes = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + faltan);
  const mes = String(lunes.getMonth() + 1).padStart(2, '0');
  const dia = String(lunes.getDate()).padStart(2, '0');
  return `${lunes.getFullYear()}-${mes}-${dia}`;
}

/**
 * Sin query → hoy + mañana (hoy primero).
 * Con query → historial completo filtrado por paciente, cliente, tipo, fecha, estado, peluquero.
 */
export function filtrarBaniosListado<T extends BanioListadoFila>(
  filas: T[] | null | undefined,
  opts: FiltrarBaniosListadoOpts = {}
): T[] {
  const query = String(opts.query || '').trim();
  if (!query) {
    const partes = partirBaniosHoyManana(filas, opts);
    return [...partes.hoy, ...partes.manana, ...partes.lunes];
  }
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
