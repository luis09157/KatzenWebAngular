/**
 * Etapa A (2026-10-27) — «Cierre del día»: lo que quedó abierto de días anteriores.
 * Solo junta y ordena; no cambia datos. Las acciones las confirma la persona.
 */
import { normalizeFechaIso } from '../core/utils/periodo-filtro.util';

export type TipoPendienteCierre = 'banio' | 'cita' | 'ticket';

export interface PendienteCierre {
  tipo: TipoPendienteCierre;
  id: string;
  fecha: string;
  titulo: string;
  detalle: string;
  /** Registro original (para guardarlo al confirmar). */
  raw: Record<string, unknown>;
}

type Obj = Record<string, unknown>;
const s = (v: unknown) => String(v ?? '').trim();

function fechaDe(...vals: unknown[]): string {
  for (const v of vals) {
    const f = normalizeFechaIso(s(v));
    if (f) return f;
  }
  return '';
}

/**
 * Baños «programado» / «en_proceso», citas «pendiente» / «confirmada» y tickets abiertos
 * con fecha ANTERIOR a hoy. Más viejo primero.
 */
export function pendientesDeDiasPasados(
  data: { banios?: Obj[]; citas?: Obj[]; tickets?: Obj[] },
  hoyIso: string
): PendienteCierre[] {
  const out: PendienteCierre[] = [];
  for (const b of data.banios || []) {
    if (!b || b['activo'] === false) continue;
    const estado = s(b['estado']).toLowerCase();
    if (estado !== 'programado' && estado !== 'en_proceso') continue;
    const fecha = fechaDe(b['fecha_banio']);
    if (!fecha || fecha >= hoyIso) continue;
    out.push({
      tipo: 'banio',
      id: s(b['id']),
      fecha,
      titulo: s(b['paciente']) || 'Baño',
      detalle: [s(b['tipo_servicio']).replace(/_/g, ' '), s(b['cliente'])].filter(Boolean).join(' · '),
      raw: b,
    });
  }
  for (const c of data.citas || []) {
    if (!c || c['activo'] === false) continue;
    const estado = s(c['estado']).toLowerCase();
    if (estado !== 'pendiente' && estado !== 'confirmada') continue;
    // `fecha` es el instante real (UTC con Z); `fecha_hora` viejo quedó en UTC sin zona.
    const fecha = fechaDe(c['fecha'], c['fecha_hora']);
    if (!fecha || fecha >= hoyIso) continue;
    out.push({
      tipo: 'cita',
      id: s(c['id']),
      fecha,
      titulo: s(c['paciente']) || 'Cita',
      detalle: [s(c['motivo']), s(c['cliente'])].filter(Boolean).join(' · '),
      raw: c,
    });
  }
  for (const t of data.tickets || []) {
    if (!t) continue;
    const estado = s(t['estado']).toLowerCase();
    if (estado !== 'abierta' && estado !== 'parcial') continue;
    const fecha = fechaDe(t['fecha']);
    if (!fecha || fecha >= hoyIso) continue;
    const saldo = Number(t['saldo']) || 0;
    out.push({
      tipo: 'ticket',
      id: s(t['id']),
      fecha,
      titulo: s(t['cliente']) || 'Ticket',
      detalle: saldo > 0 ? `Saldo $${saldo.toFixed(2)}` : 'Sin cobrar',
      raw: t,
    });
  }
  return out.filter((p) => p.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export const TIPO_CIERRE_LABELS: Record<TipoPendienteCierre, string> = {
  banio: 'Baño',
  cita: 'Cita',
  ticket: 'Ticket abierto',
};
