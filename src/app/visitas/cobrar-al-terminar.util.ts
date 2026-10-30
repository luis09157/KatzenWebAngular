/**
 * Spec 116.3 — «¿Cobrar ahora?» al guardar una consulta nueva o una vacuna aplicada.
 * Funciones puras: cuándo preguntar y qué línea se agrega al ticket del día.
 * El cobro usa el mismo camino que «Enviar a cobrar» (VisitasService.agregarServicioAVisita).
 */
import { fechaIsoLocalDeValor } from '../dashboard/hoy-operacion.util';

export interface CobroAlTerminarLinea {
  cliente_id: string;
  cliente?: string;
  paciente_id: string;
  paciente: string;
  descripcion: string;
  categoria: 'consulta' | 'vacuna';
  historialId?: string;
  vacunaId?: string;
  /** YYYY-MM-DD local; vacío = hoy. */
  fecha?: string;
  montoSugerido: number;
}

export interface CobroAlTerminarPregunta {
  titulo: string;
  /** Texto extra (p. ej. refuerzo de vacuna). */
  detalle?: string;
  linea: CobroAlTerminarLinea;
}

function texto(v: unknown): string {
  return String(v ?? '').trim();
}

/** ¿Se pregunta «¿Cobrar ahora?» al guardar una consulta? */
export function debeOfrecerCobroConsulta(opts: {
  esNueva: boolean;
  /** Viene de una cita: el flujo de Citas ya pregunta el cobro. */
  citaId?: unknown;
  yaEnTicket?: unknown;
}): boolean {
  return opts.esNueva && !texto(opts.citaId) && !texto(opts.yaEnTicket);
}

/** ¿Se pregunta al guardar una vacuna? Solo nuevas y aplicadas (las pendientes no se cobran). */
export function debeOfrecerCobroVacuna(opts: { esNueva: boolean; vacuna: Record<string, unknown> | null | undefined }): boolean {
  const v = opts.vacuna || {};
  if (!opts.esNueva || texto(v['visitaId'])) return false;
  const est = texto(v['estado']).toLowerCase();
  return v['aplicada'] === true || est === 'aplicada' || est === 'completada';
}

/** Línea de ticket para una consulta (misma descripción que «Enviar a cobrar» en Historiales). */
export function lineaCobroConsulta(h: Record<string, unknown>, extra: { clienteId?: string; paciente?: string } = {}): CobroAlTerminarLinea {
  const paciente = texto(h['paciente_nombre']) || texto(h['paciente']) || texto(extra.paciente) || 'paciente';
  const diag = (texto(h['diagnostico_presuntivo']) || 'consulta').slice(0, 60);
  return {
    cliente_id: texto(h['cliente_id']) || texto(extra.clienteId),
    cliente: texto(h['cliente']) || undefined,
    paciente_id: texto(h['paciente_id']),
    paciente,
    descripcion: `Consulta · ${paciente} · ${diag}`,
    categoria: 'consulta',
    historialId: texto(h['id']) || undefined,
    fecha: fechaIsoLocalDeValor(h['fecha_registro']) || undefined,
    montoSugerido: 0,
  };
}

/** Línea de ticket para una vacuna (misma descripción que «Enviar a cobrar» en Vacunas). */
export function lineaCobroVacuna(
  v: Record<string, unknown>,
  extra: { clienteId?: string; paciente?: string; nombreVacuna?: string } = {}
): CobroAlTerminarLinea {
  const paciente = texto(v['paciente']) || texto(extra.paciente) || 'paciente';
  const nombre =
    texto(extra.nombreVacuna) || texto(v['nombreVacunaLabel']) || texto(v['tipo_vacuna']) || texto(v['vacuna']) || 'vacuna';
  const precio = Number(v['precio']);
  return {
    cliente_id: texto(v['cliente_id']) || texto(v['idCliente']) || texto(extra.clienteId),
    cliente: texto(v['cliente']) || undefined,
    paciente_id: texto(v['paciente_id']) || texto(v['idPaciente']),
    paciente,
    descripcion: `Vacuna · ${nombre} · ${paciente}`,
    categoria: 'vacuna',
    vacunaId: texto(v['id']) || undefined,
    // fechaAplicacion se guarda en UTC: se toma el día local (no el día siguiente en la noche).
    fecha: fechaIsoLocalDeValor(v['fechaAplicacion'] || v['fecha_vacuna']) || undefined,
    montoSugerido: precio > 0 ? precio : 0,
  };
}
