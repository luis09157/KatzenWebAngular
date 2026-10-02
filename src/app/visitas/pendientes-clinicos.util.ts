/**
 * Spec 086 — pendientes clínicos (vacuna / historial) para POS y cola de cobro.
 * Mismo molde que baños (085): listos del día → ticket → al cobrar salen.
 */
import { VisitaLinea } from './visitas.models';

export type ClinicoPendienteTipo = 'vacuna' | 'historial' | 'cita';

export interface ClinicoPendienteTicket {
  id: string;
  tipo: ClinicoPendienteTipo;
  cliente_id: string;
  cliente?: string;
  paciente_id?: string;
  paciente?: string;
  fecha: string;
  /** Sugerido al incluir (puede ser 0 → pedir monto). */
  montoSugerido: number;
  titulo: string;
  detalle?: string;
}

export interface VacunaColaInput {
  id?: string;
  paciente_id?: string;
  idPaciente?: string;
  cliente_id?: string;
  idCliente?: string;
  fecha_vacuna?: string;
  fechaAplicacion?: string;
  fecha_aplicacion?: string;
  tipo_vacuna?: string;
  vacuna?: string;
  estado?: string;
  aplicada?: boolean;
  precio?: number;
  visitaId?: string;
  activo?: boolean;
  paciente?: string;
}

export interface HistorialColaInput {
  id?: string;
  cliente_id?: string;
  paciente_id?: string;
  paciente?: string;
  fecha_registro?: string;
  diagnostico_presuntivo?: string;
  motivo_consulta?: string;
  visitaId?: string;
  cajaMovimientoId?: string;
  cobradaEnVisitaId?: string;
  activo?: boolean;
  /** Aditivo opcional si algún día se guarda precio en historial. */
  precio?: number;
  precioCobro?: number;
}

function fechaIso(val: string | undefined | null): string {
  if (!val) return '';
  const raw = String(val);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw.includes('T')) return raw.split('T')[0];
  if (raw.includes(' ')) return raw.split(' ')[0];
  return raw.slice(0, 10);
}

export function esVacunaAplicada(v: VacunaColaInput | null | undefined): boolean {
  if (!v) return false;
  const est = String(v.estado || '').toLowerCase();
  if (est === 'aplicada' || est === 'completada') return true;
  return v.aplicada === true;
}

export function esVacunaPendienteDeTicket(v: VacunaColaInput | null | undefined): boolean {
  if (!v?.id || v.activo === false) return false;
  if (!esVacunaAplicada(v)) return false;
  if (String(v.visitaId || '').trim()) return false;
  return true;
}

export function esHistorialPendienteDeTicket(h: HistorialColaInput | null | undefined): boolean {
  if (!h?.id || h.activo === false) return false;
  if (String(h.visitaId || '').trim()) return false;
  if (String(h.cobradaEnVisitaId || '').trim()) return false;
  if (String(h.cajaMovimientoId || '').trim()) return false;
  return true;
}

export function filtrarVacunasPendientesTicket(
  vacunas: VacunaColaInput[] | null | undefined,
  opts: {
    clienteId: string;
    fecha: string;
    pacienteId?: string;
    clientesPorPaciente?: Record<string, string>;
    nombresPaciente?: Record<string, string>;
  }
): ClinicoPendienteTicket[] {
  const clienteId = String(opts.clienteId || '').trim();
  const fecha = String(opts.fecha || '')
    .trim()
    .slice(0, 10);
  const pacienteFiltro = String(opts.pacienteId || '').trim();
  if (!clienteId || !fecha) return [];

  return (vacunas || [])
    .filter(esVacunaPendienteDeTicket)
    .map((v) => {
      const pacienteId = String(v.paciente_id || v.idPaciente || '').trim();
      const dueño =
        String(v.cliente_id || v.idCliente || '').trim() || String(opts.clientesPorPaciente?.[pacienteId] || '').trim();
      const f = fechaIso(v.fecha_vacuna || v.fechaAplicacion || v.fecha_aplicacion);
      const tipo = String(v.tipo_vacuna || v.vacuna || 'vacuna').replace(/_/g, ' ');
      return {
        raw: v,
        pacienteId,
        dueño,
        f,
        tipo,
        item: {
          id: v.id!,
          tipo: 'vacuna' as const,
          cliente_id: dueño,
          paciente_id: pacienteId || undefined,
          paciente: v.paciente || opts.nombresPaciente?.[pacienteId],
          fecha: f,
          montoSugerido: Number(v.precio) || 0,
          titulo: v.paciente || opts.nombresPaciente?.[pacienteId] || 'Mascota',
          detalle: `Vacuna · ${tipo}`,
        } satisfies ClinicoPendienteTicket,
      };
    })
    .filter((x) => x.dueño === clienteId && x.f === fecha)
    .filter((x) => !pacienteFiltro || x.pacienteId === pacienteFiltro)
    .map((x) => x.item);
}

export function filtrarHistorialesPendientesTicket(
  historiales: HistorialColaInput[] | null | undefined,
  opts: {
    clienteId: string;
    fecha: string;
    pacienteId?: string;
    clientesPorPaciente?: Record<string, string>;
  }
): ClinicoPendienteTicket[] {
  const clienteId = String(opts.clienteId || '').trim();
  const fecha = String(opts.fecha || '')
    .trim()
    .slice(0, 10);
  const pacienteFiltro = String(opts.pacienteId || '').trim();
  if (!clienteId || !fecha) return [];

  return (historiales || [])
    .filter(esHistorialPendienteDeTicket)
    .map((h) => {
      const pacienteId = String(h.paciente_id || '').trim();
      const dueño = String(h.cliente_id || '').trim() || String(opts.clientesPorPaciente?.[pacienteId] || '').trim();
      const f = fechaIso(h.fecha_registro);
      const diag = String(h.diagnostico_presuntivo || h.motivo_consulta || 'consulta')
        .trim()
        .slice(0, 48);
      const sugerido = Number(h.precioCobro ?? h.precio) || 0;
      return {
        pacienteId,
        dueño,
        f,
        item: {
          id: h.id!,
          tipo: 'historial' as const,
          cliente_id: dueño,
          paciente_id: pacienteId || undefined,
          paciente: h.paciente,
          fecha: f,
          montoSugerido: sugerido,
          titulo: h.paciente || 'Mascota',
          detalle: `Consulta · ${diag}`,
        } satisfies ClinicoPendienteTicket,
      };
    })
    .filter((x) => x.dueño === clienteId && x.f === fecha)
    .filter((x) => !pacienteFiltro || x.pacienteId === pacienteFiltro)
    .map((x) => x.item);
}

export function vacunaYaEnLineas(lineas: VisitaLinea[] | null | undefined, vacunaId: string): boolean {
  const id = String(vacunaId || '').trim();
  if (!id) return false;
  return (lineas || []).some((l) => String(l.vacunaId || '') === id);
}

export function historialYaEnLineas(lineas: VisitaLinea[] | null | undefined, historialId: string): boolean {
  const id = String(historialId || '').trim();
  if (!id) return false;
  return (lineas || []).some((l) => String(l.historialId || '') === id);
}

export function clinicoYaEnLineas(lineas: VisitaLinea[] | null | undefined, p: ClinicoPendienteTicket): boolean {
  if (p.tipo === 'vacuna') return vacunaYaEnLineas(lineas, p.id);
  if (p.tipo === 'historial') return historialYaEnLineas(lineas, p.id);
  return (lineas || []).some((l) => String(l.citaId || '') === p.id);
}

/**
 * Religa líneas sin origen a pendientes del día (precio exacto o único pendiente del tipo).
 */
export function vincularClinicosHuerfanosEnLineas(
  lineas: VisitaLinea[] | null | undefined,
  pendientes: ClinicoPendienteTicket[] | null | undefined
): VisitaLinea[] {
  const out = (lineas || []).map((l) => ({ ...l }));
  const usadosVac = new Set(out.map((l) => String(l.vacunaId || '').trim()).filter(Boolean));
  const usadosHist = new Set(out.map((l) => String(l.historialId || '').trim()).filter(Boolean));

  const poolVac = (pendientes || []).filter((p) => p.tipo === 'vacuna' && p.id && !usadosVac.has(p.id));
  const poolHist = (pendientes || []).filter((p) => p.tipo === 'historial' && p.id && !usadosHist.has(p.id));

  for (const linea of out) {
    const cat = String(linea.categoria || '').toLowerCase();
    const monto = Number(linea.monto) || 0;

    if (cat === 'vacuna' && !String(linea.vacunaId || '').trim()) {
      let idx = poolVac.findIndex((p) => Math.abs((Number(p.montoSugerido) || 0) - monto) < 0.021);
      if (idx < 0 && poolVac.length === 1) idx = 0;
      if (idx >= 0) {
        const matched = poolVac.splice(idx, 1)[0];
        linea.vacunaId = matched.id;
        usadosVac.add(matched.id);
      }
    }

    if (cat === 'consulta' && !String(linea.historialId || '').trim() && !String(linea.citaId || '').trim()) {
      let idx = poolHist.findIndex((p) => Math.abs((Number(p.montoSugerido) || 0) - monto) < 0.021);
      if (idx < 0 && poolHist.length === 1) idx = 0;
      if (idx >= 0) {
        const matched = poolHist.splice(idx, 1)[0];
        linea.historialId = matched.id;
        usadosHist.add(matched.id);
      }
    }
  }

  return out;
}

export function descripcionLineaClinico(p: ClinicoPendienteTicket): string {
  if (p.detalle) return p.detalle.includes(p.titulo || '') ? p.detalle : `${p.detalle} · ${p.titulo}`;
  return p.tipo === 'vacuna' ? `Vacuna · ${p.titulo}` : `Consulta · ${p.titulo}`;
}
