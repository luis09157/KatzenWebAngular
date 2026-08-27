/** Contexto mínimo de cita para flujo visita del día (spec 041). */
export interface VisitaDiaCitaContext {
  id?: string;
  cliente_id?: string;
  cliente?: string;
  paciente_id?: string;
  paciente?: string;
  motivo?: string;
  fecha?: string;
  fecha_hora?: string;
  precio?: number;
  monto?: number;
  visitaId?: string;
  cajaMovimientoId?: string;
  cobrada?: boolean;
}

export type VisitaDiaFlujoAccion = 'historial' | 'ticket' | 'historial_ticket' | 'omitir';

export function puedeOfrecerFlujoVisitaDia(cita: VisitaDiaCitaContext | null | undefined): boolean {
  if (!cita?.cliente_id || !cita?.paciente_id) return false;
  if (cita.visitaId || cita.cajaMovimientoId || cita.cobrada) return false;
  return true;
}
