/**
 * Etapa B (spec 111, 2026-10-27) — «Para avisar hoy».
 *
 * Funciones puras (sin Angular ni Firebase): arman la lista de clientes a los que conviene
 * avisar hoy y el mensaje de WhatsApp de cada uno. NO guardan ni mandan nada: la veterinaria
 * autoriza cada aviso con «Enviar al cliente». La misma lógica sirve después para un envío
 * automático desde el servidor (cuando Luis lo autorice).
 */
import { fechaLocalCita } from '../citas/cita-agenda.util';
import { formatLocalDate, normalizeFechaIso, parseLocalDate } from '../core/utils/periodo-filtro.util';
import {
  NOMBRE_CLINICA_DEFAULT,
  buildWhatsappUrl,
  formatearFechaLargaEs,
  normalizarTelefonoMx,
  textoTipoRecordatorio,
} from '../recordatorios/recordatorio-whatsapp.util';

/** Baño recomendado cada 4 semanas (Luis, 2026-10-27). */
export const SEMANAS_BANIO_DEFAULT = 4;
/** Vacuna y desparasitación: se avisa desde 7 días antes (Luis, 2026-10-27). */
export const DIAS_ANTICIPACION_REFUERZO = 7;
/** Baños «ya toca» más viejos que esto no salen (los de 2024 son para una campaña aparte). */
export const DIAS_ATRASO_MAX_BANIO = 21;
/** Recordatorios vencidos hace más de esto ya no salen. */
export const DIAS_ATRASO_MAX_RECORDATORIO = 3;

export type TipoAviso = 'banio_proximo' | 'banio_manana' | 'cita_manana' | 'recordatorio';
export type OrigenAviso = 'banio' | 'cita' | 'recordatorio';

export const TIPO_AVISO_LABELS: Record<TipoAviso, string> = {
  banio_proximo: 'Ya toca baño',
  banio_manana: 'Baño mañana',
  cita_manana: 'Cita mañana',
  recordatorio: 'Recordatorio',
};

/** Registro que se marca al enviar / descartar. */
export interface RefAviso {
  origen: OrigenAviso;
  id: string;
}

export interface AvisoPendiente {
  /** Única por grupo (dueño + tipo + fecha). */
  clave: string;
  tipo: TipoAviso;
  refs: RefAviso[];
  clienteId: string;
  dueno: string;
  mascotas: string[];
  /** `YYYY-MM-DD` del evento (baño, cita, refuerzo o cuándo toca el baño). */
  fecha: string;
  hora: string;
  /** Texto corto para la fila: «Vacuna Triple Felina», «Último baño 29 sep». */
  detalle: string;
  telefono10: string | null;
  mensaje: string;
  whatsappUrl: string;
}

export interface ParaAvisarInput {
  banios?: ReadonlyArray<Record<string, any>> | null;
  citas?: ReadonlyArray<Record<string, any>> | null;
  recordatorios?: ReadonlyArray<Record<string, any>> | null;
  pacientes?: ReadonlyArray<Record<string, any>> | null;
  clientes?: ReadonlyArray<Record<string, any>> | null;
}

export interface ParaAvisarOpts {
  semanasBanio?: number;
  clinica?: string;
}

const s = (v: unknown): string => (v == null ? '' : String(v)).trim();

function sumarDias(iso: string, dias: number): string {
  const d = parseLocalDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + dias);
  return formatLocalDate(d);
}

function mascotaActiva(p: Record<string, any> | undefined): boolean {
  if (!p) return false;
  if (p['activo'] === false) return false;
  return s(p['estado']).toLowerCase() !== 'fallecido';
}

function clienteDe(p: Record<string, any> | undefined, explicito?: unknown): string {
  return s(explicito) || s(p?.['idCliente']) || s(p?.['cliente_id']);
}

function nombreDueno(c: Record<string, any> | undefined): string {
  if (!c) return '';
  return (
    [c['nombre'], c['apellidoPaterno']].map(s).filter(Boolean).join(' ') || s(c['razonSocial']) || s(c['nombreCliente'])
  );
}

function primerNombre(c: Record<string, any> | undefined): string {
  return s(c?.['nombre']).split(/\s+/)[0] || '';
}

/** «Coco», «Coco y Nacho», «Coco, Nacho y Tina». */
export function listaNombres(nombres: string[]): string {
  const n = nombres.filter(Boolean);
  if (n.length <= 1) return n[0] || 'tu mascota';
  return `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`;
}

/** «18:00» → «6:00 p.m.»; vacío si no hay hora. */
export function hora12(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(s(hhmm));
  if (!m) return '';
  const h = Number(m[1]);
  const suf = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suf}`;
}

function horaCita(c: Record<string, any>): string {
  const directa = s(c['hora']);
  if (/^\d{1,2}:\d{2}/.test(directa)) return directa.slice(0, 5);
  const fecha = s(c['fecha']);
  if (fecha.includes('T')) {
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return '';
}

/** Mensaje de WhatsApp para un aviso (sin URL). */
export function mensajeAviso(
  a: Pick<AvisoPendiente, 'tipo' | 'mascotas' | 'fecha' | 'hora' | 'detalle'> & {
    nombreDueno?: string;
    tipoRecordatorio?: string;
    ultimoBanio?: string;
  },
  opts: { clinica?: string; hoy?: Date } = {}
): string {
  const clinica = s(opts.clinica) || NOMBRE_CLINICA_DEFAULT;
  const saludo = a.nombreDueno ? `Hola ${a.nombreDueno}, te saludamos de ${clinica}.` : `Hola, te saludamos de ${clinica}.`;
  const mascotas = listaNombres(a.mascotas);
  const fechaTxt = formatearFechaLargaEs(a.fecha, opts.hoy);
  const horaTxt = hora12(a.hora);
  const aLas = horaTxt ? ` a las ${horaTxt}` : '';
  switch (a.tipo) {
    case 'banio_proximo': {
      const ult = a.ultimoBanio ? formatearFechaLargaEs(a.ultimoBanio, opts.hoy) : '';
      const desde = ult ? ` Su último baño fue el ${ult}.` : '';
      return `${saludo}\nYa le toca baño a ${mascotas}.${desde}\n¿Te lo agendamos? Responde este mensaje y te damos horario.`;
    }
    case 'banio_manana':
      return `${saludo}\nTe esperamos mañana ${fechaTxt}${aLas} para el baño de ${mascotas}.\nResponde este mensaje para confirmar.`;
    case 'cita_manana': {
      const motivo = a.detalle ? ` (${a.detalle})` : '';
      return `${saludo}\nTe recordamos la cita de ${mascotas} mañana ${fechaTxt}${aLas}${motivo}.\nResponde este mensaje para confirmar.`;
    }
    default: {
      const tipo = textoTipoRecordatorio(a.tipoRecordatorio);
      const detalle = a.detalle && a.detalle.toLowerCase() !== tipo ? ` (${a.detalle})` : '';
      return `${saludo}\nTe recordamos que ${mascotas} tiene ${tipo} el ${fechaTxt}${detalle}.\nResponde este mensaje para confirmar.`;
    }
  }
}

interface Borrador {
  tipo: TipoAviso;
  ref: RefAviso;
  clienteId: string;
  mascota: string;
  fecha: string;
  hora: string;
  detalle: string;
  tipoRecordatorio?: string;
  ultimoBanio?: string;
}

/**
 * Lista «Para avisar hoy». `hoyIso` = `YYYY-MM-DD` local.
 * Agrupa por dueño + tipo + fecha (4 perros de la misma dueña = 1 mensaje).
 */
export function paraAvisarHoy(input: ParaAvisarInput, hoyIso: string, opts: ParaAvisarOpts = {}): AvisoPendiente[] {
  const hoy = s(hoyIso).slice(0, 10);
  if (!hoy) return [];
  const manana = sumarDias(hoy, 1);
  const semanas = Number(opts.semanasBanio) > 0 ? Number(opts.semanasBanio) : SEMANAS_BANIO_DEFAULT;

  const pacientes = new Map<string, Record<string, any>>();
  for (const p of input.pacientes || []) if (p && s(p['id'])) pacientes.set(s(p['id']), p);
  const clientes = new Map<string, Record<string, any>>();
  for (const c of input.clientes || []) if (c && s(c['id'])) clientes.set(s(c['id']), c);

  const borradores: Borrador[] = [];
  const banios = (input.banios || []).filter((b) => b && b['activo'] !== false);

  // 1) Baños de mañana (programados).
  for (const b of banios) {
    if (s(b['estado']) !== 'programado') continue;
    if (normalizeFechaIso(s(b['fecha_banio'])) !== manana) continue;
    if (b['avisoEnviadoEn'] || b['avisoDescartadoEn']) continue;
    const pid = s(b['paciente_id']);
    const p = pacientes.get(pid);
    if (p && !mascotaActiva(p)) continue;
    borradores.push({
      tipo: 'banio_manana',
      ref: { origen: 'banio', id: s(b['id']) },
      clienteId: clienteDe(p, b['cliente_id']),
      mascota: s(p?.['nombre']) || s(b['paciente']),
      fecha: manana,
      hora: s(b['hora_banio']).slice(0, 5),
      detalle: s(b['tipo_servicio']).replace(/_/g, ' '),
    });
  }

  // 2) «Ya toca baño»: último baño completado + N semanas, sin otro baño agendado.
  const conBanioAgendado = new Set(
    banios
      .filter((b) => s(b['estado']) === 'programado' || s(b['estado']) === 'en_proceso')
      .map((b) => s(b['paciente_id']))
  );
  const ultimo = new Map<string, Record<string, any>>();
  for (const b of banios) {
    if (s(b['estado']) !== 'completado') continue;
    const pid = s(b['paciente_id']);
    const f = normalizeFechaIso(s(b['fecha_banio']));
    if (!pid || !f) continue;
    const prev = ultimo.get(pid);
    if (!prev || normalizeFechaIso(s(prev['fecha_banio']))! < f) ultimo.set(pid, b);
  }
  for (const [pid, b] of ultimo) {
    if (conBanioAgendado.has(pid)) continue;
    if (b['avisoProximoEnviadoEn'] || b['avisoProximoDescartadoEn']) continue;
    const p = pacientes.get(pid);
    if (!mascotaActiva(p)) continue;
    const fUlt = normalizeFechaIso(s(b['fecha_banio']))!;
    const toca = sumarDias(fUlt, semanas * 7);
    if (!toca || toca > sumarDias(hoy, 2) || toca < sumarDias(hoy, -DIAS_ATRASO_MAX_BANIO)) continue;
    borradores.push({
      tipo: 'banio_proximo',
      ref: { origen: 'banio', id: s(b['id']) },
      clienteId: clienteDe(p, b['cliente_id']),
      mascota: s(p?.['nombre']) || s(b['paciente']),
      fecha: toca,
      hora: '',
      detalle: '',
      ultimoBanio: fUlt,
    });
  }

  // 3) Citas de mañana.
  for (const c of input.citas || []) {
    if (!c || c['activo'] === false) continue;
    const estado = s(c['estado']).toLowerCase();
    if (estado !== 'pendiente' && estado !== 'confirmada') continue;
    if (fechaLocalCita(c as any) !== manana) continue;
    if (c['avisoEnviadoEn'] || c['avisoDescartadoEn']) continue;
    const p = pacientes.get(s(c['paciente_id']));
    if (p && !mascotaActiva(p)) continue;
    borradores.push({
      tipo: 'cita_manana',
      ref: { origen: 'cita', id: s(c['id']) },
      clienteId: clienteDe(p, c['cliente_id']),
      mascota: s(p?.['nombre']) || s(c['paciente']),
      fecha: manana,
      hora: horaCita(c),
      detalle: s(c['motivo']),
    });
  }

  // 4) Recordatorios pendientes (vacuna/desparasitación desde 7 días antes; los demás desde 1 día antes).
  for (const r of input.recordatorios || []) {
    if (!r || r['activo'] === false) continue;
    if (s(r['estado']).toLowerCase() !== 'pendiente') continue;
    if (r['whatsappEnviadoEn'] || r['avisoDescartadoEn']) continue;
    const f = normalizeFechaIso(s(r['fecha_hora_recordatorio']) || s(r['fecha_recordatorio']));
    if (!f) continue;
    const tipo = s(r['tipo']).toLowerCase();
    const anticipa = tipo === 'vacuna' || tipo === 'desparasitacion' ? DIAS_ANTICIPACION_REFUERZO : 1;
    if (hoy < sumarDias(f, -anticipa) || hoy > sumarDias(f, DIAS_ATRASO_MAX_RECORDATORIO)) continue;
    const p = pacientes.get(s(r['paciente_id']));
    if (p && !mascotaActiva(p)) continue;
    borradores.push({
      tipo: 'recordatorio',
      ref: { origen: 'recordatorio', id: s(r['id']) },
      clienteId: clienteDe(p, r['cliente_id']),
      mascota: s(p?.['nombre']) || s(r['paciente']),
      fecha: f,
      hora: '',
      detalle: s(r['titulo']),
      tipoRecordatorio: tipo,
    });
  }

  // Agrupar: mismo dueño + tipo + fecha (+ tipo de recordatorio).
  const grupos = new Map<string, Borrador[]>();
  for (const b of borradores) {
    if (!b.ref.id) continue;
    const k = [b.clienteId || `sin-${b.ref.id}`, b.tipo, b.fecha, b.tipoRecordatorio || ''].join('|');
    const g = grupos.get(k);
    if (g) g.push(b);
    else grupos.set(k, [b]);
  }

  const out: AvisoPendiente[] = [];
  for (const [clave, g] of grupos) {
    const base = g[0];
    const cliente = clientes.get(base.clienteId);
    const telefono10 = normalizarTelefonoMx(s(cliente?.['telefono']));
    const mascotas = [...new Set(g.map((b) => b.mascota).filter(Boolean))];
    const hora = g.map((b) => b.hora).filter(Boolean).sort()[0] || '';
    const detalles = [...new Set(g.map((b) => b.detalle).filter(Boolean))];
    const detalle = base.tipo === 'banio_proximo' ? '' : detalles.join(', ');
    const ultimoBanio = g.map((b) => b.ultimoBanio || '').filter(Boolean).sort()[0];
    const mensaje = mensajeAviso(
      {
        tipo: base.tipo,
        mascotas,
        fecha: base.fecha,
        hora,
        detalle,
        nombreDueno: primerNombre(cliente),
        tipoRecordatorio: base.tipoRecordatorio,
        ultimoBanio,
      },
      { clinica: opts.clinica, hoy: parseLocalDate(hoy) || undefined }
    );
    out.push({
      clave,
      tipo: base.tipo,
      refs: g.map((b) => b.ref),
      clienteId: base.clienteId,
      dueno: nombreDueno(cliente),
      mascotas,
      fecha: base.fecha,
      hora,
      detalle:
        base.tipo === 'banio_proximo' && ultimoBanio
          ? `Último baño ${formatearFechaLargaEs(ultimoBanio, parseLocalDate(hoy) || undefined)}`
          : detalle,
      telefono10,
      mensaje,
      whatsappUrl: telefono10 ? buildWhatsappUrl(telefono10, mensaje) : '',
    });
  }

  const orden: Record<TipoAviso, number> = { cita_manana: 0, banio_manana: 1, recordatorio: 2, banio_proximo: 3 };
  return out.sort((a, b) => orden[a.tipo] - orden[b.tipo] || a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
}

/** Campo opcional (aditivo) que se escribe al enviar o descartar, por origen y tipo. */
export function campoMarcaAviso(tipo: TipoAviso, origen: OrigenAviso, accion: 'enviado' | 'descartado'): string {
  if (origen === 'recordatorio') return accion === 'enviado' ? 'whatsappEnviadoEn' : 'avisoDescartadoEn';
  if (tipo === 'banio_proximo') return accion === 'enviado' ? 'avisoProximoEnviadoEn' : 'avisoProximoDescartadoEn';
  return accion === 'enviado' ? 'avisoEnviadoEn' : 'avisoDescartadoEn';
}
