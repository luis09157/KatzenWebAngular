import { Banio } from '../shared/banio.model';
import { VisitaLinea } from './visitas.models';

export interface BanioPendienteTicket {
  id: string;
  cliente_id: string;
  cliente?: string;
  paciente_id?: string;
  paciente?: string;
  fecha_banio?: string;
  tipo_servicio?: string;
  precio_total: number;
  costoEstimado?: number;
  categoria: 'banio' | 'corte';
  /** Spec 085 — nota de la peluquera para mostrador. */
  observaciones?: string;
}

function fechaBanioIso(banio: Banio): string {
  const raw = String(banio.fecha_banio || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw.includes('T')) return raw.split('T')[0];
  if (raw.includes(' ')) return raw.split(' ')[0];
  return raw.slice(0, 10);
}

export function esBanioPendienteDeTicket(banio: Banio | null | undefined): boolean {
  if (!banio?.id || banio.activo === false) return false;
  if (banio.estado === 'cancelado') return false;
  // Spec 085: solo listos para cobrar (completado); al cobrar (visitaId/pagado/caja) salen
  if (String(banio.estado || '').toLowerCase() !== 'completado') return false;
  if (banio.visitaId || banio.cajaMovimientoId || banio.pagado) return false;
  if (!String(banio.cliente_id || '').trim()) return false;
  const monto = Number(banio.precio_total) || 0;
  return monto > 0;
}

export function filtrarBaniosPendientesTicket(
  banios: Banio[] | null | undefined,
  opts: { clienteId: string; fecha: string; pacienteId?: string }
): BanioPendienteTicket[] {
  const clienteId = String(opts.clienteId || '').trim();
  const fecha = String(opts.fecha || '')
    .trim()
    .slice(0, 10);
  const pacienteId = String(opts.pacienteId || '').trim();
  if (!clienteId || !fecha) return [];

  return (banios || [])
    .filter(esBanioPendienteDeTicket)
    .filter((b) => String(b.cliente_id || '').trim() === clienteId)
    .filter((b) => fechaBanioIso(b) === fecha)
    .filter((b) => !pacienteId || String(b.paciente_id || '').trim() === pacienteId)
    .map((b) => {
      const tipo = String(b.tipo_servicio || '').toLowerCase();
      return {
        id: b.id!,
        cliente_id: b.cliente_id,
        cliente: b.cliente,
        paciente_id: b.paciente_id,
        paciente: b.paciente,
        fecha_banio: fechaBanioIso(b),
        tipo_servicio: b.tipo_servicio,
        precio_total: Number(b.precio_total) || 0,
        costoEstimado:
          b.costoEstimado != null && !Number.isNaN(Number(b.costoEstimado)) ? Number(b.costoEstimado) : undefined,
        categoria: tipo.includes('corte') ? ('corte' as const) : ('banio' as const),
        observaciones: String(b.observaciones || '').trim() || undefined,
      };
    });
}

export function descripcionLineaBanio(p: BanioPendienteTicket): string {
  const tipo = String(p.tipo_servicio || 'servicio').replace(/_/g, ' ');
  const mascota = p.paciente || 'paciente';
  return `Baño · ${mascota} · ${tipo}`;
}

export function banioYaEnLineas(lineas: VisitaLinea[] | null | undefined, banioId: string): boolean {
  const id = String(banioId || '').trim();
  if (!id) return false;
  return (lineas || []).some((l) => String(l.banioId || '') === id);
}

/**
 * Spec 085 — si cobraron con «Nuevo baño» sin tocar la nota, la línea no lleva banioId
 * y el baño sigue en por-cobrar. Religa líneas huérfanas a pendientes del día (precio exacto,
 * o el único pendiente restante). No adivina si hay varios con montos distintos.
 */
export function vincularBaniosHuerfanosEnLineas(
  lineas: VisitaLinea[] | null | undefined,
  pendientes: BanioPendienteTicket[] | null | undefined
): VisitaLinea[] {
  const out = (lineas || []).map((l) => ({ ...l }));
  const usados = new Set(out.map((l) => String(l.banioId || '').trim()).filter(Boolean));
  const pool = (pendientes || []).filter((p) => p?.id && !usados.has(String(p.id)));

  for (const linea of out) {
    if (String(linea.banioId || '').trim()) continue;
    const cat = String(linea.categoria || '').toLowerCase();
    if (cat !== 'banio' && cat !== 'corte') continue;

    const monto = Number(linea.monto) || 0;
    let idx = pool.findIndex((p) => Math.abs((Number(p.precio_total) || 0) - monto) < 0.021);
    if (idx < 0 && pool.length === 1) {
      idx = 0;
    }
    if (idx < 0) continue;

    const matched = pool.splice(idx, 1)[0];
    linea.banioId = matched.id;
    usados.add(matched.id);
  }

  return out;
}
