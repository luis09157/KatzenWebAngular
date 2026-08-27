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
  categoria: 'banio' | 'corte';
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
  if (banio.visitaId || banio.cajaMovimientoId || banio.pagado) return false;
  if (!String(banio.cliente_id || '').trim()) return false;
  return true;
}

export function filtrarBaniosPendientesTicket(
  banios: Banio[] | null | undefined,
  opts: { clienteId: string; fecha: string; pacienteId?: string }
): BanioPendienteTicket[] {
  const clienteId = String(opts.clienteId || '').trim();
  const fecha = String(opts.fecha || '').trim().slice(0, 10);
  const pacienteId = String(opts.pacienteId || '').trim();
  if (!clienteId || !fecha) return [];

  return (banios || [])
    .filter(esBanioPendienteDeTicket)
    .filter(b => String(b.cliente_id || '').trim() === clienteId)
    .filter(b => fechaBanioIso(b) === fecha)
    .filter(b => !pacienteId || String(b.paciente_id || '').trim() === pacienteId)
    .map(b => {
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
        categoria: tipo.includes('corte') ? ('corte' as const) : ('banio' as const)
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
  return (lineas || []).some(l => String(l.banioId || '') === id);
}
