/**
 * Spec 033 — helpers puros para auto-crear recordatorio de refuerzo desde vacuna.
 */

export interface VacunaRefuerzoInput {
  id?: string;
  vacuna?: string;
  dosis?: string;
  idPaciente?: string;
  paciente_id?: string;
  idCliente?: string;
  cliente_id?: string;
  fechaAplicacion?: string | Date | null;
  fecha?: string | Date | null;
  proximaAplicacion?: string | Date | null;
  fechaRecordatorio?: string | Date | null;
  intervalo?: number | string | null;
  nombreVacunaLabel?: string;
}

export interface FechaRecordatorioResuelta {
  isoLocal: string;
  dayKey: string;
  labelEs: string;
}

/** Normaliza a Date válido o null. Fechas solo-día (`YYYY-MM-DD`) → medianoche local. */
export function parseFechaFlexible(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const s = String(value).trim();
  const soloDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (soloDia) {
    const y = Number(soloDia[1]);
    const m = Number(soloDia[2]) - 1;
    const d = Number(soloDia[3]);
    const local = new Date(y, m, d, 0, 0, 0, 0);
    return isNaN(local.getTime()) ? null : local;
  }
  // `YYYY-MM-DD HH:mm:ss` (convención RTDB web)
  const rtdb = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (rtdb) {
    const local = new Date(
      Number(rtdb[1]),
      Number(rtdb[2]) - 1,
      Number(rtdb[3]),
      Number(rtdb[4]),
      Number(rtdb[5]),
      Number(rtdb[6] || 0),
      0
    );
    return isNaN(local.getTime()) ? null : local;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD en zona local (dedupe por día). */
export function dayKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO-like `YYYY-MM-DD HH:mm:ss` local (convención RTDB web). */
export function formatRtdbLocal(d: Date): string {
  const day = dayKeyLocal(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${day} ${hh}:${mm}:${ss}`;
}

export function labelFechaEs(d: Date): string {
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Calcula próxima aplicación desde fecha + intervalo (días).
 */
export function calcularProximaDesdeIntervalo(
  fechaAplicacion: string | Date | null | undefined,
  intervalo: number | string | null | undefined
): Date | null {
  const base = parseFechaFlexible(fechaAplicacion);
  const days = Number(intervalo);
  if (!base || !Number.isFinite(days) || days <= 0) return null;
  const prox = new Date(base.getTime());
  prox.setDate(prox.getDate() + days);
  return prox;
}

/**
 * Resuelve fecha del recordatorio:
 * 1) fechaRecordatorio
 * 2) proximaAplicacion (09:00 si viene a medianoche/sin hora útil)
 * 3) calculada por intervalo
 */
export function resolverFechaRecordatorioRefuerzo(
  input: VacunaRefuerzoInput
): FechaRecordatorioResuelta | null {
  let target =
    parseFechaFlexible(input.fechaRecordatorio) ||
    parseFechaFlexible(input.proximaAplicacion) ||
    calcularProximaDesdeIntervalo(
      input.fechaAplicacion || input.fecha,
      input.intervalo
    );

  if (!target) return null;

  // Si solo hay fecha de calendario (00:00), usar 09:00 local
  if (
    target.getHours() === 0 &&
    target.getMinutes() === 0 &&
    target.getSeconds() === 0 &&
    !input.fechaRecordatorio
  ) {
    target = new Date(target.getTime());
    target.setHours(9, 0, 0, 0);
  }

  return {
    isoLocal: formatRtdbLocal(target),
    dayKey: dayKeyLocal(target),
    labelEs: labelFechaEs(target)
  };
}

export function nombreVacunaDisplay(input: VacunaRefuerzoInput): string {
  if (input.nombreVacunaLabel?.trim()) return input.nombreVacunaLabel.trim();
  const raw = String(input.vacuna || 'Vacuna').trim();
  return raw
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function buildTituloRecordatorioRefuerzo(input: VacunaRefuerzoInput): string {
  return `Refuerzo vacuna: ${nombreVacunaDisplay(input)}`;
}

export function buildDescripcionRecordatorioRefuerzo(
  input: VacunaRefuerzoInput,
  fecha: FechaRecordatorioResuelta
): string {
  const nombre = nombreVacunaDisplay(input);
  const dosis = input.dosis ? ` (${input.dosis})` : '';
  return `Próximo refuerzo de ${nombre}${dosis} programado para el ${fecha.labelEs}.`;
}

export interface RecordatorioCandidatoDedupe {
  id?: string;
  paciente_id?: string;
  tipo?: string;
  estado?: string;
  activo?: boolean | number;
  vacunaId?: string;
  vacuna_relacionada_id?: string;
  fecha_hora_recordatorio?: string;
  fecha_recordatorio?: string;
  titulo?: string;
}

function dayKeyFromRecordatorio(r: RecordatorioCandidatoDedupe): string | null {
  const d =
    parseFechaFlexible(r.fecha_hora_recordatorio) ||
    parseFechaFlexible(r.fecha_recordatorio);
  return d ? dayKeyLocal(d) : null;
}

/**
 * Busca pendiente activo equivalente: misma vacunaId, o mismo paciente+tipo+día+título refuerzo.
 */
export function encontrarRecordatorioEquivalente(
  existentes: RecordatorioCandidatoDedupe[],
  opts: {
    vacunaId?: string;
    pacienteId: string;
    dayKey: string;
    titulo: string;
  }
): RecordatorioCandidatoDedupe | null {
  const activos = (existentes || []).filter(
    r =>
      r &&
      r.activo !== false &&
      r.activo !== 0 &&
      String(r.estado || 'pendiente').toLowerCase() === 'pendiente'
  );

  if (opts.vacunaId) {
    const byVacuna = activos.find(
      r =>
        r.vacunaId === opts.vacunaId ||
        r.vacuna_relacionada_id === opts.vacunaId
    );
    if (byVacuna) return byVacuna;
  }

  return (
    activos.find(r => {
      if (r.paciente_id !== opts.pacienteId) return false;
      if (String(r.tipo || '').toLowerCase() !== 'vacuna') return false;
      const dk = dayKeyFromRecordatorio(r);
      if (dk !== opts.dayKey) return false;
      const tit = String(r.titulo || '');
      return tit === opts.titulo || tit.toLowerCase().includes('refuerzo');
    }) || null
  );
}

export function debeAsegurarRecordatorioRefuerzo(input: VacunaRefuerzoInput): boolean {
  return resolverFechaRecordatorioRefuerzo(input) != null;
}
