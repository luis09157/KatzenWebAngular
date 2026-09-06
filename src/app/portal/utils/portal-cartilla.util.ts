import { formatDisplayDate } from './portal-display.util';

export type CartillaKind =
  'banio' | 'vacuna' | 'cita' | 'historial' | 'recordatorio' | 'pension' | 'visita' | 'consentimiento';

export interface CartillaEvento {
  id: string;
  kind: CartillaKind;
  fecha: string;
  titulo: string;
  detalle: string;
  estado?: string;
}

export interface MascotaActivityChips {
  ultimoBanio: string | null;
  proximaVacuna: string | null;
  recordatorio: string | null;
}

function parseSortableDate(raw: unknown): number {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const t = new Date(trimmed.replace(' ', 'T')).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    const [d, m, y] = trimmed.split(/[\s/]+/);
    const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  const t = new Date(trimmed).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function pushEvento(out: CartillaEvento[], ev: CartillaEvento): void {
  if (!ev.id) return;
  out.push(ev);
}

export function buildCartillaEventos(input: {
  banos?: Array<Record<string, unknown>>;
  vacunas?: Array<Record<string, unknown>>;
  citas?: Array<Record<string, unknown>>;
  historiales?: Array<Record<string, unknown>>;
  recordatorios?: Array<Record<string, unknown>>;
  pensiones?: Array<Record<string, unknown>>;
  visitas?: Array<Record<string, unknown>>;
  consentimientos?: Array<Record<string, unknown>>;
}): CartillaEvento[] {
  const out: CartillaEvento[] = [];

  for (const b of input.banos || []) {
    const fecha = `${b['fecha_banio'] || ''} ${b['hora_banio'] || ''}`.trim();
    pushEvento(out, {
      id: String(b['id'] || ''),
      kind: 'banio',
      fecha,
      titulo: String(b['tipo_servicio_label'] || 'Baño'),
      detalle: [b['peluquero'], b['observaciones']].filter(Boolean).map(String).join(' · '),
      estado: String(b['estado'] || ''),
    });
  }

  for (const v of input.vacunas || []) {
    pushEvento(out, {
      id: String(v['id'] || ''),
      kind: 'vacuna',
      fecha: String(v['fecha'] || ''),
      titulo: String(v['vacuna'] || 'Vacuna'),
      detalle: v['proximaAplicacion']
        ? `Próxima: ${formatDisplayDate(String(v['proximaAplicacion']))}`
        : String(v['veterinario'] || ''),
      estado: '',
    });
  }

  for (const c of input.citas || []) {
    pushEvento(out, {
      id: String(c['id'] || ''),
      kind: 'cita',
      fecha: String(c['fecha_hora'] || ''),
      titulo: String(c['motivo'] || 'Cita'),
      detalle: String(c['veterinario'] || ''),
      estado: String(c['estado'] || ''),
    });
  }

  for (const h of input.historiales || []) {
    pushEvento(out, {
      id: String(h['id'] || ''),
      kind: 'historial',
      fecha: String(h['fecha_registro'] || ''),
      titulo: String(h['diagnostico'] || 'Consulta'),
      detalle: String(h['medico_atendio'] || ''),
      estado: '',
    });
  }

  for (const r of input.recordatorios || []) {
    pushEvento(out, {
      id: String(r['id'] || ''),
      kind: 'recordatorio',
      fecha: String(r['fecha'] || ''),
      titulo: String(r['titulo'] || 'Recordatorio'),
      detalle: String(r['acuerdoHint'] || r['notas'] || ''),
      estado: String(r['estado'] || ''),
    });
  }

  for (const p of input.pensiones || []) {
    pushEvento(out, {
      id: String(p['id'] || ''),
      kind: 'pension',
      fecha: String(p['fecha_ingreso'] || ''),
      titulo: `Pensión · ${p['estado_label'] || p['estado'] || ''}`,
      detalle: String(p['notas'] || ''),
      estado: String(p['estado'] || ''),
    });
  }

  for (const v of input.visitas || []) {
    pushEvento(out, {
      id: String(v['id'] || ''),
      kind: 'visita',
      fecha: String(v['fecha'] || ''),
      titulo: `Visita · ${v['estado_label'] || v['estado'] || ''}`,
      detalle: '',
      estado: String(v['estado'] || ''),
    });
  }

  for (const c of input.consentimientos || []) {
    pushEvento(out, {
      id: String(c['id'] || ''),
      kind: 'consentimiento',
      fecha: String(c['fecha'] || ''),
      titulo: String(c['tipo_label'] || 'Consentimiento'),
      detalle: String(c['firmado_por'] || ''),
      estado: String(c['estado'] || ''),
    });
  }

  return out.sort((a, b) => parseSortableDate(b.fecha) - parseSortableDate(a.fecha));
}

export function buildMascotaActivityChips(input: {
  banos?: Array<Record<string, unknown>>;
  vacunas?: Array<Record<string, unknown>>;
  recordatorios?: Array<Record<string, unknown>>;
  now?: number;
}): MascotaActivityChips {
  const now = input.now ?? Date.now();
  const banos = [...(input.banos || [])]
    .filter((b) => !/cancel/i.test(String(b['estado'] || '')))
    .sort(
      (a, b) =>
        parseSortableDate(`${b['fecha_banio'] || ''} ${b['hora_banio'] || ''}`) -
        parseSortableDate(`${a['fecha_banio'] || ''} ${a['hora_banio'] || ''}`)
    );
  const ultimo = banos[0];
  const ultimoBanio = ultimo
    ? `${ultimo['tipo_servicio_label'] || 'Baño'} · ${formatDisplayDate(String(ultimo['fecha_banio'] || ''))}`
    : null;

  const proximasVac = [...(input.vacunas || [])]
    .map((v) => ({
      nombre: String(v['vacuna'] || 'Vacuna'),
      fecha: String(v['proximaAplicacion'] || ''),
    }))
    .filter((v) => v.fecha && parseSortableDate(v.fecha) >= now - 12 * 60 * 60 * 1000)
    .sort((a, b) => parseSortableDate(a.fecha) - parseSortableDate(b.fecha));
  const proximaVacuna = proximasVac[0] ? `${proximasVac[0].nombre} · ${formatDisplayDate(proximasVac[0].fecha)}` : null;

  const recs = [...(input.recordatorios || [])]
    .filter((r) => !/complet|cancel/i.test(String(r['estado'] || '')))
    .sort((a, b) => parseSortableDate(a['fecha']) - parseSortableDate(b['fecha']));
  const rec = recs[0];
  const recordatorio = rec
    ? `${rec['titulo'] || 'Recordatorio'} · ${formatDisplayDate(String(rec['fecha'] || ''))}`
    : null;

  return { ultimoBanio, proximaVacuna, recordatorio };
}

export function splitCitasProximasPasadas<T extends { fecha_hora?: unknown; estado?: unknown }>(
  citas: T[],
  now = Date.now()
): { proximas: T[]; pasadas: T[] } {
  const proximas: T[] = [];
  const pasadas: T[] = [];
  for (const c of citas) {
    const t = parseSortableDate(c.fecha_hora);
    const cancelada = /cancel/i.test(String(c.estado || ''));
    if (!cancelada && t >= now - 30 * 60 * 1000) {
      proximas.push(c);
    } else {
      pasadas.push(c);
    }
  }
  proximas.sort((a, b) => parseSortableDate(a.fecha_hora) - parseSortableDate(b.fecha_hora));
  pasadas.sort((a, b) => parseSortableDate(b.fecha_hora) - parseSortableDate(a.fecha_hora));
  return { proximas, pasadas };
}
