/**
 * Filtros de agenda arriba de la lista (Citas, Peluquería, Pensión) — Luis, 2026-10-26.
 *
 * - Pendientes (por defecto): lo que falta hacer, en secciones Atrasados → Hoy → Mañana → Próximos días.
 * - Hechos: lo ya atendido.
 * - Por cobrar: hecho y sin pagar.
 * - Pagados: ya cobrado (puede estar pagado por adelantado aunque no esté hecho).
 * - Todos: historial completo.
 *
 * «Hecho» y «pagado» son independientes; por eso cada filtro es una sola pregunta.
 * Solo lectura: no cambia datos en RTDB.
 */

import { formatLocalDate, hoyLocalIsoDate, normalizeFechaIso } from './periodo-filtro.util';

export type FiltroAgenda = 'pendientes' | 'hechos' | 'por_cobrar' | 'pagados' | 'todos';

export const FILTROS_AGENDA: ReadonlyArray<{ id: FiltroAgenda; label: string }> = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'hechos', label: 'Hechos' },
  { id: 'por_cobrar', label: 'Por cobrar' },
  { id: 'pagados', label: 'Pagados' },
  { id: 'todos', label: 'Todos' },
];

export interface ClasificadorAgenda<T> {
  /** Fecha de agenda `YYYY-MM-DD` (o vacía si no tiene). */
  fechaIso(row: T): string;
  /** Hora para ordenar dentro del día (`HH:mm`), opcional. */
  horaOrden?(row: T): string;
  /** Falta hacerlo (no hecho ni cancelado). */
  esPendiente(row: T): boolean;
  esHecho(row: T): boolean;
  esPagado(row: T): boolean;
  /**
   * Pendiente que va en «Hoy» aunque su fecha no sea hoy (ej. pensión activa).
   * Se evalúa después de «Atrasados».
   */
  vaEnHoy?(row: T, hoyIso: string): boolean;
}

export type TonoSeccionAgenda = 'atrasado' | 'hoy' | 'manana' | 'proximo' | 'sin_fecha';

export interface SeccionAgenda<T> {
  id: string;
  titulo: string;
  icono: string;
  tono: TonoSeccionAgenda;
  filas: T[];
}

export function esFiltroAgenda(valor: unknown): valor is FiltroAgenda {
  return FILTROS_AGENDA.some((f) => f.id === valor);
}

function fechaDe<T>(c: ClasificadorAgenda<T>, row: T): string {
  return normalizeFechaIso(c.fechaIso(row)) || '';
}

function claveOrden<T>(c: ClasificadorAgenda<T>, row: T): string {
  return `${fechaDe(c, row) || '0000-00-00'} ${c.horaOrden ? c.horaOrden(row) || '' : ''}`;
}

export function esPorCobrarAgenda<T>(c: ClasificadorAgenda<T>, row: T): boolean {
  return c.esHecho(row) && !c.esPagado(row);
}

/** ¿La fila entra en el filtro? */
export function filaEnFiltroAgenda<T>(c: ClasificadorAgenda<T>, row: T, filtro: FiltroAgenda): boolean {
  switch (filtro) {
    case 'pendientes':
      return c.esPendiente(row);
    case 'hechos':
      return c.esHecho(row);
    case 'por_cobrar':
      return esPorCobrarAgenda(c, row);
    case 'pagados':
      return c.esPagado(row);
    default:
      return true;
  }
}

/**
 * Filas del filtro, ordenadas: pendientes de la más próxima a la más lejana;
 * el resto de la más reciente a la más vieja.
 */
export function filtrarAgenda<T>(rows: T[] | null | undefined, filtro: FiltroAgenda, c: ClasificadorAgenda<T>): T[] {
  const out = (rows || []).filter((r) => filaEnFiltroAgenda(c, r, filtro));
  const asc = filtro === 'pendientes';
  return out.sort((a, b) => {
    const ka = claveOrden(c, a);
    const kb = claveOrden(c, b);
    if (ka === kb) return 0;
    return (ka < kb ? -1 : 1) * (asc ? 1 : -1);
  });
}

export function contarFiltrosAgenda<T>(
  rows: T[] | null | undefined,
  c: ClasificadorAgenda<T>
): Record<FiltroAgenda, number> {
  const cuenta: Record<FiltroAgenda, number> = { pendientes: 0, hechos: 0, por_cobrar: 0, pagados: 0, todos: 0 };
  for (const r of rows || []) {
    cuenta.todos++;
    if (c.esPendiente(r)) cuenta.pendientes++;
    if (c.esHecho(r)) cuenta.hechos++;
    if (esPorCobrarAgenda(c, r)) cuenta.por_cobrar++;
    if (c.esPagado(r)) cuenta.pagados++;
  }
  return cuenta;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** «Miércoles 28/10» a partir de `YYYY-MM-DD` (calendario local). */
export function tituloDiaAgenda(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const fecha = new Date(y, m - 1, d);
  return `${DIAS[fecha.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/**
 * Pendientes en secciones: Atrasados → Hoy → Mañana → un bloque por día siguiente → Sin fecha.
 * Las secciones vacías de Atrasados/Próximos/Sin fecha no se devuelven; Hoy y Mañana siempre
 * (para que la pantalla diga «no hay nada hoy»).
 */
export function seccionesPendientesAgenda<T>(
  rows: T[] | null | undefined,
  c: ClasificadorAgenda<T>,
  opts: { now?: Date; hoyIso?: string } = {}
): SeccionAgenda<T>[] {
  const now = opts.now || new Date();
  const hoyIso = String(opts.hoyIso || hoyLocalIsoDate(now)).slice(0, 10);
  const [hy, hm, hd] = hoyIso.split('-').map(Number);
  const mananaIso = formatLocalDate(new Date(hy, hm - 1, hd + 1));

  const pendientes = filtrarAgenda(rows, 'pendientes', c);
  const atrasados: T[] = [];
  const hoy: T[] = [];
  const manana: T[] = [];
  const sinFecha: T[] = [];
  const porDia = new Map<string, T[]>();

  for (const r of pendientes) {
    const f = fechaDe(c, r);
    if (f && f < hoyIso) {
      atrasados.push(r);
    } else if (f === hoyIso || (c.vaEnHoy && c.vaEnHoy(r, hoyIso))) {
      hoy.push(r);
    } else if (f === mananaIso) {
      manana.push(r);
    } else if (!f) {
      sinFecha.push(r);
    } else {
      const lista = porDia.get(f) || [];
      lista.push(r);
      porDia.set(f, lista);
    }
  }

  const secciones: SeccionAgenda<T>[] = [];
  if (atrasados.length) {
    secciones.push({ id: 'atrasados', titulo: 'Atrasados', icono: 'warning', tono: 'atrasado', filas: atrasados });
  }
  secciones.push({ id: 'hoy', titulo: 'Hoy', icono: 'today', tono: 'hoy', filas: hoy });
  secciones.push({ id: 'manana', titulo: 'Mañana', icono: 'event', tono: 'manana', filas: manana });
  [...porDia.keys()].sort().forEach((iso) => {
    secciones.push({ id: iso, titulo: tituloDiaAgenda(iso), icono: 'date_range', tono: 'proximo', filas: porDia.get(iso) || [] });
  });
  if (sinFecha.length) {
    secciones.push({ id: 'sin_fecha', titulo: 'Sin fecha', icono: 'help_outline', tono: 'sin_fecha', filas: sinFecha });
  }
  return secciones;
}
