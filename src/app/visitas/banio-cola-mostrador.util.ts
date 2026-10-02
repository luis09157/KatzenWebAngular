/**
 * Spec 085 — cola de mostrador («Por cobrar hoy») vs historial.
 * Cola corta del día: solo listos para cobrar; al vincular ticket/pago salen.
 */

export interface BanioColaMostradorInput {
  id?: string;
  cliente_id?: string;
  fecha_banio?: string;
  precio_total?: number;
  estado?: string;
  pagado?: boolean;
  visitaId?: string;
  cajaMovimientoId?: string;
  activo?: boolean;
  observaciones?: string;
}

function fechaIso(val: string | undefined | null): string {
  if (!val) return '';
  const raw = String(val);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw.includes('T')) return raw.split('T')[0];
  if (raw.includes(' ')) return raw.split(' ')[0];
  return raw.slice(0, 10);
}

/** Baño marcado listo para que mostrador lo cobre (opción A: estado completado). */
export function esBanioListoParaCobrar(banio: BanioColaMostradorInput | null | undefined): boolean {
  if (!banio) return false;
  return String(banio.estado || '').toLowerCase() === 'completado';
}

/**
 * ¿Debe aparecer en Cobrar → Por cobrar hoy?
 * - Hoy, activo, no cancelado
 * - Listo para cobrar (completado)
 * - precio_total > 0
 * - Sin visitaId / pagado / caja (al cobrar desaparece)
 */
export function esBanioEnColaMostradorHoy(banio: BanioColaMostradorInput | null | undefined, hoy: string): boolean {
  if (!banio?.id || !String(banio.cliente_id || '').trim()) return false;
  if (banio.activo === false) return false;
  const est = String(banio.estado || '').toLowerCase();
  if (est === 'cancelado') return false;
  if (!esBanioListoParaCobrar(banio)) return false;
  if (banio.pagado) return false;
  if (String(banio.visitaId || '').trim()) return false;
  if (String(banio.cajaMovimientoId || '').trim()) return false;
  const f = fechaIso(banio.fecha_banio);
  if (f !== String(hoy || '').slice(0, 10)) return false;
  const monto = Number(banio.precio_total) || 0;
  return monto > 0;
}
