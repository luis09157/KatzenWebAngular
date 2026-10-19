/**
 * Listados admin con agenda diaria (spec 085 B.1 + follow-up 061):
 * sin búsqueda → Hoy + Mañana (ISO local);
 * al buscar → historial filtrado.
 *
 * Módulos sin fecha de servicio (clientes, productos, usuarios, etc.)
 * no deben forzar Hoy/Mañana — solo shell + búsqueda.
 */

import { formatLocalDate, hoyLocalIsoDate, normalizeFechaIso } from './periodo-filtro.util';

export type GetFechasAgendaIsoFn<T> = (row: T) => Array<string | null | undefined>;

export interface ListadoHoyMananaOpts {
  hoyIso?: string;
  mananaIso?: string;
  now?: Date;
  /**
   * Filas extra que entran en «Hoy» aunque su fecha de agenda no coincida
   * (ej. pensión `activa` iniciada antes).
   */
  extraHoy?: (row: unknown) => boolean;
}

export interface ListadoHoyMananaResult<T> {
  hoy: T[];
  manana: T[];
  hoyIso: string;
  mananaIso: string;
}

export interface FiltrarListadoAgendaOpts<T> extends ListadoHoyMananaOpts {
  query?: string | null;
  /** Campos/texto de búsqueda; si no, usa `coincideBusqueda`. */
  coincideBusqueda?: (row: T, queryLower: string) => boolean;
  getFechasIso: GetFechasAgendaIsoFn<T>;
}

/** ISO `YYYY-MM-DD` del día siguiente en calendario local (no UTC). */
export function fechaMananaLocal(ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1);
  return formatLocalDate(d);
}

/** Alias claro para listados (misma base que `hoyLocalIsoDate`). */
export function fechaHoyListadoLocal(ref: Date = new Date()): string {
  return hoyLocalIsoDate(ref);
}

/** Normaliza a `YYYY-MM-DD` o cadena vacía. */
export function listadoFechaIso(raw: string | null | undefined, fallback?: string | null): string {
  return normalizeFechaIso(raw) || normalizeFechaIso(fallback) || '';
}

/** ¿Alguna de las fechas de agenda coincide con el ISO dado? */
export function filaCoincideFechaIso(fechas: Array<string | null | undefined>, fechaIso: string): boolean {
  const iso = String(fechaIso || '').slice(0, 10);
  if (!iso) return false;
  return (fechas || []).some((f) => listadoFechaIso(f) === iso);
}

export function filtrarFilasPorFechaIso<T>(
  filas: T[] | null | undefined,
  fechaIso: string,
  getFechasIso: GetFechasAgendaIsoFn<T>
): T[] {
  const iso = String(fechaIso || '').slice(0, 10);
  if (!iso) return [];
  return (filas || []).filter((f) => filaCoincideFechaIso(getFechasIso(f), iso));
}

/**
 * Parte filas en Hoy y Mañana.
 * Si una fila cae en ambos, prioriza Hoy (no duplica).
 * `extraHoy` suma a Hoy sin quitar de Mañana si también aplica.
 */
export function partirListadoHoyManana<T>(
  filas: T[] | null | undefined,
  getFechasIso: GetFechasAgendaIsoFn<T>,
  opts: ListadoHoyMananaOpts = {}
): ListadoHoyMananaResult<T> {
  const now = opts.now || new Date();
  const hoyIso = String(opts.hoyIso || fechaHoyListadoLocal(now)).slice(0, 10);
  const mananaIso = String(opts.mananaIso || fechaMananaLocal(now)).slice(0, 10);
  const hoy: T[] = [];
  const manana: T[] = [];

  for (const f of filas || []) {
    const fechas = getFechasIso(f);
    const esHoy = filaCoincideFechaIso(fechas, hoyIso) || (!!opts.extraHoy && opts.extraHoy(f));
    if (esHoy) {
      hoy.push(f);
      continue;
    }
    if (filaCoincideFechaIso(fechas, mananaIso)) {
      manana.push(f);
    }
  }

  return { hoy, manana, hoyIso, mananaIso };
}

/** Búsqueda case-insensitive en lista de campos. */
export function coincidenciaTextoListado(campos: Array<unknown>, queryLower: string): boolean {
  const q = String(queryLower || '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  return campos.some((v) =>
    String(v ?? '')
      .toLowerCase()
      .includes(q)
  );
}

/**
 * Sin query → hoy + mañana (hoy primero).
 * Con query → historial filtrado por `coincideBusqueda`.
 */
export function filtrarListadoAgendaOBusqueda<T>(
  filas: T[] | null | undefined,
  opts: FiltrarListadoAgendaOpts<T>
): T[] {
  const list = filas || [];
  const q = String(opts.query || '')
    .trim()
    .toLowerCase();

  if (!q) {
    const { hoy, manana } = partirListadoHoyManana(list, opts.getFechasIso, opts);
    return [...hoy, ...manana];
  }

  const match = opts.coincideBusqueda || (() => true);
  return list.filter((f) => match(f, q));
}

/**
 * Meta del panel:
 * sin búsqueda → «Hoy · N · Mañana · M»;
 * con búsqueda → «Búsqueda · N de M históricos».
 */
export function metaListadoHoyManana(opts: {
  visibles?: number;
  visiblesHoy?: number;
  visiblesManana?: number;
  totales: number;
  query?: string | null;
}): string {
  const tot = Number(opts.totales) || 0;
  if (!tot) return '';
  const q = String(opts.query || '').trim();
  if (!q) {
    const h = Number(opts.visiblesHoy ?? 0) || 0;
    const m = Number(opts.visiblesManana ?? 0) || 0;
    return `Hoy · ${h} · Mañana · ${m}`;
  }
  const n = Number(opts.visibles) || 0;
  return `Búsqueda · ${n} de ${tot} históricos`;
}
