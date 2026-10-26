/**
 * Spec 072 follow-up — agenda del mes en /admin/inicio.
 * Cada día: citas, baños de esa fecha y estancias de pensión que cubren el día.
 */

import { fechaIsoLocalDeValor } from './hoy-operacion.util';

export interface CitaCalendarioLike {
  id?: string;
  fecha?: unknown;
  fecha_hora?: unknown;
  activo?: boolean;
  hora?: string;
  paciente_id?: string;
  idPaciente?: string;
  cliente_id?: string;
  paciente?: string;
  cliente?: string;
  motivo?: string;
  estado?: string;
  veterinario?: string;
}

export interface BanioCalendarioLike {
  id?: string;
  fecha_banio?: unknown;
  hora_banio?: string;
  activo?: boolean;
  estado?: string;
  paciente_id?: string;
  paciente?: string;
  cliente_id?: string;
  cliente?: string;
  tipo_servicio?: string;
}

export interface PensionCalendarioLike {
  id?: string;
  activo?: boolean;
  estado?: string;
  fecha_ingreso?: unknown;
  fecha_salida_prevista?: unknown;
  fecha_salida_real?: unknown;
  paciente_id?: string;
  paciente?: string;
  cliente_id?: string;
  cliente?: string;
}

export type AgendaEventoTipo = 'cita' | 'peluqueria' | 'pension';

export interface AgendaEventoDia {
  tipo: AgendaEventoTipo;
  id?: string;
  paciente_id?: string;
  paciente?: string;
  cliente_id?: string;
  cliente?: string;
  hora?: string;
  /** Estado tal como viene de RTDB (pendiente, activa, reservada…). */
  estado?: string;
  /** Peluquería: tipo de servicio (`baño_con_corte`…). */
  servicio?: string;
  /** Pensión: rango que cubre la estancia (ISO). `hasta` vacío = sin salida registrada. */
  desde?: string;
  hasta?: string;
  /** Cita original: detalle y Atender siguen usando este objeto. */
  cita?: CitaCalendarioLike;
}

export interface CalendarioAgendaExtra {
  baniosMap?: Record<string, BanioCalendarioLike[]>;
  estancias?: PensionCalendarioLike[] | null;
}

export interface CalendarioDiaCell {
  day: number;
  /** Solo días del mes visible; undefined en celdas de relleno. */
  date?: Date;
  isoKey?: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  /** Hay citas, baños o pensión ese día. El nombre se conserva por la clase CSS. */
  hasCitas: boolean;
  citas: CitaCalendarioLike[];
  eventos: AgendaEventoDia[];
}

export function citaFechaIsoKey(cita: CitaCalendarioLike | null | undefined): string | null {
  if (!cita) return null;
  return fechaIsoLocalDeValor(cita.fecha) || fechaIsoLocalDeValor(cita.fecha_hora);
}

export function isoKeyFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Agrupa citas activas por `YYYY-MM-DD` local. */
export function buildCitasMapByDate(
  citas: CitaCalendarioLike[] | null | undefined
): Record<string, CitaCalendarioLike[]> {
  const map: Record<string, CitaCalendarioLike[]> = {};
  for (const cita of citas || []) {
    if (cita?.activo === false) continue;
    const key = citaFechaIsoKey(cita);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push(cita);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')));
  }
  return map;
}

/** Baños activos, no cancelados, agrupados por `fecha_banio` local. */
export function buildBaniosMapByDate(
  banios: BanioCalendarioLike[] | null | undefined
): Record<string, BanioCalendarioLike[]> {
  const map: Record<string, BanioCalendarioLike[]> = {};
  for (const banio of banios || []) {
    if (!banio || banio.activo === false) continue;
    if (String(banio.estado || '').toLowerCase() === 'cancelado') continue;
    const key = fechaIsoLocalDeValor(banio.fecha_banio);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push(banio);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => String(a.hora_banio || '').localeCompare(String(b.hora_banio || '')));
  }
  return map;
}

/** Estancia activa/reservada sin fecha de salida: cubre todos los días desde el ingreso. */
const SIN_SALIDA = '9999-12-31';

/**
 * Rango inclusivo de la estancia. Sin salida y activa/reservada queda abierta.
 * Canceladas o inactivas no entran.
 */
export function rangoEstanciaPension(
  estancia: PensionCalendarioLike | null | undefined
): { desde: string; hasta: string } | null {
  if (!estancia || estancia.activo === false) return null;
  const estado = String(estancia.estado || '').toLowerCase();
  if (estado === 'cancelada') return null;
  const desde = fechaIsoLocalDeValor(estancia.fecha_ingreso);
  if (!desde) return null;
  const salida =
    fechaIsoLocalDeValor(estancia.fecha_salida_real) || fechaIsoLocalDeValor(estancia.fecha_salida_prevista);
  let hasta = salida;
  if (!hasta) {
    hasta = estado === 'activa' || estado === 'reservada' ? SIN_SALIDA : desde;
  }
  if (hasta < desde) hasta = desde;
  return { desde, hasta };
}

export function estanciaCubreDia(estancia: PensionCalendarioLike | null | undefined, isoKey: string): boolean {
  const rango = rangoEstanciaPension(estancia);
  if (!rango || !isoKey) return false;
  return isoKey >= rango.desde && isoKey <= rango.hasta;
}

/** «2 citas · 1 peluquería · 1 pensión» para el encabezado del día. */
export function resumenAgendaDia(eventos: AgendaEventoDia[] | null | undefined): string {
  const n = { cita: 0, peluqueria: 0, pension: 0 } as Record<AgendaEventoTipo, number>;
  for (const ev of eventos || []) n[ev.tipo]++;
  const partes: string[] = [];
  if (n.cita) partes.push(`${n.cita} cita${n.cita === 1 ? '' : 's'}`);
  if (n.peluqueria) partes.push(`${n.peluqueria} peluquería`);
  if (n.pension) partes.push(`${n.pension} en pensión`);
  return partes.length ? partes.join(' · ') : 'Nada en agenda este día';
}

export function etiquetaAgendaTipo(tipo: AgendaEventoTipo): string {
  if (tipo === 'peluqueria') return 'Peluquería';
  if (tipo === 'pension') return 'Pensión';
  return 'Cita';
}

/** Una fila por evento. La misma estancia no se repite en el mismo día. */
export function eventosAgendaDelDia(
  isoKey: string,
  citas: CitaCalendarioLike[] | null | undefined,
  banios: BanioCalendarioLike[] | null | undefined,
  estancias: PensionCalendarioLike[] | null | undefined
): AgendaEventoDia[] {
  const eventos: AgendaEventoDia[] = [];
  for (const cita of citas || []) {
    eventos.push({
      tipo: 'cita',
      id: cita.id,
      paciente_id: cita.paciente_id || cita.idPaciente,
      paciente: cita.paciente,
      cliente_id: cita.cliente_id,
      cliente: cita.cliente,
      hora: cita.hora ? String(cita.hora) : undefined,
      cita,
    });
  }
  for (const banio of banios || []) {
    eventos.push({
      tipo: 'peluqueria',
      id: banio.id,
      paciente_id: banio.paciente_id,
      paciente: banio.paciente,
      cliente_id: banio.cliente_id,
      cliente: banio.cliente,
      hora: banio.hora_banio ? String(banio.hora_banio) : undefined,
      estado: banio.estado,
      servicio: banio.tipo_servicio,
    });
  }
  const pensionVistas = new Set<string>();
  for (const estancia of estancias || []) {
    if (!estanciaCubreDia(estancia, isoKey)) continue;
    const clave = estancia.id || `${estancia.paciente_id}|${estancia.fecha_ingreso}`;
    if (pensionVistas.has(clave)) continue;
    pensionVistas.add(clave);
    const rango = rangoEstanciaPension(estancia);
    eventos.push({
      tipo: 'pension',
      id: estancia.id,
      paciente_id: estancia.paciente_id,
      paciente: estancia.paciente,
      cliente_id: estancia.cliente_id,
      cliente: estancia.cliente,
      estado: estancia.estado,
      desde: rango?.desde,
      hasta: rango && rango.hasta !== SIN_SALIDA ? rango.hasta : undefined,
    });
  }
  const ordenTipo: Record<AgendaEventoTipo, number> = { cita: 0, peluqueria: 1, pension: 2 };
  eventos.sort((a, b) => {
    const ha = a.hora || '99:99';
    const hb = b.hora || '99:99';
    if (ha !== hb) return ha.localeCompare(hb);
    return ordenTipo[a.tipo] - ordenTipo[b.tipo];
  });
  return eventos;
}

/**
 * Genera celdas del mes (incluye padding de mes anterior/siguiente).
 * `monthAnchor` = cualquier fecha del mes a mostrar.
 */
export function buildCalendarioMesDays(
  monthAnchor: Date,
  citasMap: Record<string, CitaCalendarioLike[]>,
  today: Date = new Date(),
  agenda?: CalendarioAgendaExtra
): CalendarioDiaCell[] {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const days: CalendarioDiaCell[] = [];

  const todayKey = isoKeyFromLocalDate(today);

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      isToday: false,
      hasCitas: false,
      citas: [],
      eventos: [],
    });
  }

  const baniosMap = agenda?.baniosMap || {};
  const estancias = agenda?.estancias || [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isoKey = isoKeyFromLocalDate(date);
    const dayCitas = citasMap[isoKey] || [];
    const eventos = eventosAgendaDelDia(isoKey, dayCitas, baniosMap[isoKey] || [], estancias);
    days.push({
      day: d,
      date,
      isoKey,
      isCurrentMonth: true,
      isToday: isoKey === todayKey,
      hasCitas: eventos.length > 0,
      citas: dayCitas,
      eventos,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      day: days.length % 7 || 7,
      isCurrentMonth: false,
      isToday: false,
      hasCitas: false,
      citas: [],
      eventos: [],
    });
  }

  return days;
}

export function labelDiaSeleccionado(isoKey: string | null | undefined, todayIso: string): string {
  if (!isoKey) return 'Selecciona un día';
  if (isoKey === todayIso) return 'Agenda de hoy';
  const [y, m, d] = isoKey.split('-').map(Number);
  if (!y || !m || !d) return `Agenda del ${isoKey}`;
  const date = new Date(y, m - 1, d);
  return `Agenda del ${date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}`;
}
