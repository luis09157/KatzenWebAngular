/**
 * Reglas anti-doble-cobro visita ↔ caja ↔ refuerzos KPI (spec 039).
 */

export interface ServicioConCobro {
  cajaMovimientoId?: string;
  visitaId?: string;
  pagado?: boolean;
  cobrada?: boolean;
}

/** Ya tiene movimiento directo en caja. */
export function yaCobradoEnCaja(item: ServicioConCobro | null | undefined): boolean {
  return !!String(item?.cajaMovimientoId || '').trim();
}

/** Vinculado a ticket de visita (cobro debe hacerse desde visita). */
export function vinculadoATicketVisita(item: ServicioConCobro | null | undefined): boolean {
  return !!String(item?.visitaId || '').trim();
}

/** Cita marcada cobrada vía visita cerrada. */
export function citaCobradaEnVisita(item: ServicioConCobro | null | undefined): boolean {
  return item?.cobrada === true;
}

/** Bloquea «Registrar en caja» directo desde módulo clínico. */
export function bloquearCobroDirectoEnCaja(item: ServicioConCobro | null | undefined): boolean {
  return yaCobradoEnCaja(item) || vinculadoATicketVisita(item) || citaCobradaEnVisita(item);
}

/** Baño/pensión sin caja que NO deben sumarse como refuerzo (ya en ticket o cobrados). */
export function debeExcluirRefuerzoIngresoServicio(
  item: ServicioConCobro | null | undefined
): boolean {
  if (!item) return true;
  if (yaCobradoEnCaja(item)) return true;
  if (vinculadoATicketVisita(item)) return true;
  return false;
}
