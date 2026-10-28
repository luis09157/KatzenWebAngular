/**
 * Etapa C (spec 113, 2026-10-27) — Hoy como lista de trabajo.
 * Parte la agenda del día (citas y peluquería) en: por llegar, atendiéndose y terminados.
 * Pensión va en su propio panel («En pensión hoy»). Puro: sin Angular ni Firebase.
 */
import type { AgendaEventoDia } from './dashboard-calendario.util';

export type GrupoTrabajoHoy = 'por_llegar' | 'en_atencion' | 'terminado';

export interface TrabajoHoy {
  porLlegar: AgendaEventoDia[];
  enAtencion: AgendaEventoDia[];
  terminados: AgendaEventoDia[];
}

function estadoDe(ev: AgendaEventoDia): string {
  const raw = ev.tipo === 'cita' ? ev.cita?.estado ?? ev.estado : ev.estado;
  return String(raw || '')
    .trim()
    .toLowerCase();
}

/** null = no va en la lista (cancelado, no vino o pensión). */
export function grupoTrabajoHoy(ev: AgendaEventoDia): GrupoTrabajoHoy | null {
  if (!ev || ev.tipo === 'pension') return null;
  const e = estadoDe(ev);
  if (e.startsWith('cancel') || e === 'no_asistio' || e === 'no asistió') return null;
  if (ev.tipo === 'cita') {
    if (e === 'completada' || e === 'atendida' || e === 'completado') return 'terminado';
    if (e === 'en_proceso' || e === 'en_atencion' || e === 'en curso' || e === 'en_curso') return 'en_atencion';
    return 'por_llegar';
  }
  if (e === 'completado') return 'terminado';
  if (e === 'en_proceso') return 'en_atencion';
  return 'por_llegar';
}

export function listaTrabajoHoy(eventos: AgendaEventoDia[] | null | undefined): TrabajoHoy {
  const out: TrabajoHoy = { porLlegar: [], enAtencion: [], terminados: [] };
  for (const ev of eventos || []) {
    const g = grupoTrabajoHoy(ev);
    if (g === 'por_llegar') out.porLlegar.push(ev);
    else if (g === 'en_atencion') out.enAtencion.push(ev);
    else if (g === 'terminado') out.terminados.push(ev);
  }
  return out;
}

/** «3 por llegar · 1 atendiéndose · 2 terminados» (omite los ceros). */
export function resumenTrabajoHoy(t: TrabajoHoy): string {
  const partes = [
    t.porLlegar.length ? `${t.porLlegar.length} por llegar` : '',
    t.enAtencion.length ? `${t.enAtencion.length} atendiéndose` : '',
    t.terminados.length ? `${t.terminados.length} ${t.terminados.length === 1 ? 'terminado' : 'terminados'}` : '',
  ].filter(Boolean);
  return partes.join(' · ') || 'Sin citas ni baños agendados';
}
