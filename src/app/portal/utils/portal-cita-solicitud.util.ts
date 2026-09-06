/**
 * Spec 074 — la solicitud de cita por dueño NO está lista.
 * Cuando exista CitasSolicitud + validación vet, poner true y una spec nueva.
 */
export const PORTAL_CITA_SOLICITUD_ENABLED: boolean = false;

/** UI de «pedir / agendar cita» en landing y portal. Hoy siempre oculta. */
export function isCitaSolicitudUiVisible(): boolean {
  return PORTAL_CITA_SOLICITUD_ENABLED;
}
