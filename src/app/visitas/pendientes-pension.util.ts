/**
 * Spec 091 — estancias de pensión pendientes para el riel POS.
 * Mismo molde que baños (085) / clínicos (086): activas sin cobro → línea con `pensionId`.
 * No filtra por «hoy»: el checkout puede ser otro día que el ingreso (a diferencia de por-cobrar-hoy).
 */
import { descripcionCobroPension } from '../pension/pension-cobro.util';
import { PensionEstancia } from '../pension/pension.models';
import { VisitaLinea } from './visitas.models';

export interface PensionPendienteTicket {
  id: string;
  cliente_id: string;
  cliente?: string;
  paciente_id?: string;
  paciente?: string;
  fecha_ingreso?: string;
  fecha_salida_prevista?: string;
  tamano_mascota?: string | null;
  precio_dia: number;
  precio_total: number;
  costoEstimado?: number;
  /** Texto de línea (paquete) — `descripcionCobroPension`. */
  descripcion: string;
}

export function esPensionPendienteDeTicket(p: PensionEstancia | null | undefined): boolean {
  if (!p?.id || p.activo === false) return false;
  const est = String(p.estado || '').toLowerCase();
  if (est === 'cancelada' || est === 'reservada') return false;
  if (est !== 'activa' && est !== 'finalizada') return false;
  if (p.cajaMovimientoId || p.visitaId || p.cobradaEnVisitaId) return false;
  if (!String(p.cliente_id || '').trim()) return false;
  return true;
}

export function filtrarPensionesPendientesTicket(
  pensiones: PensionEstancia[] | null | undefined,
  opts: { clienteId: string; pacienteId?: string }
): PensionPendienteTicket[] {
  const clienteId = String(opts.clienteId || '').trim();
  const pacienteId = String(opts.pacienteId || '').trim();
  if (!clienteId || clienteId === '__mostrador__') return [];

  return (pensiones || [])
    .filter(esPensionPendienteDeTicket)
    .filter((p) => String(p.cliente_id || '').trim() === clienteId)
    .filter((p) => {
      if (!pacienteId) return true;
      const pid = String(p.paciente_id || '').trim();
      if (!pid || pid === 'manual') return true;
      return pid === pacienteId;
    })
    .map((p) => {
      const precioDia = Number(p.precio_dia) || 0;
      const precioTotal = Number(p.precio_total) || precioDia || 0;
      const costo =
        p.costo_total_estimado != null && !Number.isNaN(Number(p.costo_total_estimado))
          ? Number(p.costo_total_estimado)
          : undefined;
      return {
        id: p.id!,
        cliente_id: p.cliente_id,
        cliente: p.cliente,
        paciente_id: p.paciente_id,
        paciente: p.paciente,
        fecha_ingreso: p.fecha_ingreso,
        fecha_salida_prevista: p.fecha_salida_prevista,
        tamano_mascota: p.tamano_mascota,
        precio_dia: precioDia,
        precio_total: precioTotal,
        costoEstimado: costo,
        descripcion: descripcionCobroPension(p),
      };
    })
    .sort((a, b) => String(b.fecha_ingreso || '').localeCompare(String(a.fecha_ingreso || '')));
}

export function pensionYaEnLineas(lineas: VisitaLinea[] | null | undefined, pensionId: string): boolean {
  const id = String(pensionId || '').trim();
  if (!id) return false;
  return (lineas || []).some((l) => String(l.pensionId || '') === id);
}
