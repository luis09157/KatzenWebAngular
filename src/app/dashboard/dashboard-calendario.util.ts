/**
 * Spec 072 follow-up — calendario de citas en /admin/inicio.
 * Mes con indicadores; día seleccionado → lista de citas.
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

export interface CalendarioDiaCell {
  day: number;
  /** Solo días del mes visible; undefined en celdas de relleno. */
  date?: Date;
  isoKey?: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasCitas: boolean;
  citas: CitaCalendarioLike[];
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

/**
 * Genera celdas del mes (incluye padding de mes anterior/siguiente).
 * `monthAnchor` = cualquier fecha del mes a mostrar.
 */
export function buildCalendarioMesDays(
  monthAnchor: Date,
  citasMap: Record<string, CitaCalendarioLike[]>,
  today: Date = new Date()
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
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isoKey = isoKeyFromLocalDate(date);
    const dayCitas = citasMap[isoKey] || [];
    days.push({
      day: d,
      date,
      isoKey,
      isCurrentMonth: true,
      isToday: isoKey === todayKey,
      hasCitas: dayCitas.length > 0,
      citas: dayCitas,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      day: days.length % 7 || 7,
      isCurrentMonth: false,
      isToday: false,
      hasCitas: false,
      citas: [],
    });
  }

  return days;
}

export function labelDiaSeleccionado(isoKey: string | null | undefined, todayIso: string): string {
  if (!isoKey) return 'Selecciona un día';
  if (isoKey === todayIso) return 'Citas de hoy';
  const [y, m, d] = isoKey.split('-').map(Number);
  if (!y || !m || !d) return `Citas del ${isoKey}`;
  const date = new Date(y, m - 1, d);
  return `Citas del ${date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}`;
}
