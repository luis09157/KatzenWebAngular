/**
 * Spec 112 (2026-10-27) — interruptor «avisos automáticos al dueño».
 * Luis: «que aún no se manden automáticamente porque seguimos en pruebas».
 * Apagado por defecto: solo se encienden si `Katzen/Config/clinica/avisosAutomaticosAlDueno === true`.
 * Con el interruptor apagado no se escribe ni se manda NADA al dueño (push ni inbox del portal).
 * El resumen al personal (NotificacionesClinica + push staff) sigue funcionando.
 */
import { logger } from 'firebase-functions';
import { rtdb } from './fcm-helpers';

export const RUTA_INTERRUPTOR_AVISOS_DUENO = 'Katzen/Config/clinica/avisosAutomaticosAlDueno';

/** Puro: solo `true` (booleano) enciende. Cualquier otra cosa = apagado. */
export function avisosAlDuenoEncendidos(valor: unknown): boolean {
  return valor === true;
}

export async function avisosAlDuenoActivos(): Promise<boolean> {
  try {
    const snap = await rtdb().ref(RUTA_INTERRUPTOR_AVISOS_DUENO).once('value');
    return avisosAlDuenoEncendidos(snap.val());
  } catch (err) {
    // Si no se puede leer, mejor no mandar nada al dueño.
    logger.error('No se pudo leer el interruptor de avisos al dueño; se queda apagado', err);
    return false;
  }
}
