/** Prefill / picker desde «Llegó un paciente» / expediente (spec 070 / 085). Sin imports de diálogos. */

import { Cliente } from '../core/models';
import { getClienteNombreCompleto } from '../core/utils/cliente-search.util';

/** True si el diálogo clínico debe pedir dueño/mascota (no vienen del wizard). */
export function debeMostrarPickerAltaRapida(data: {
  paciente_id?: string;
  idPaciente?: string;
  esEdicion?: boolean;
  hidePatientInfo?: boolean;
}): boolean {
  if (data.esEdicion || data.hidePatientInfo) return false;
  return !String(data.paciente_id || data.idPaciente || '').trim();
}

/**
 * Etiqueta de dueño desde MAT_DIALOG_DATA del expediente / alta rápida.
 * Acepta `cliente` como string (nombre) o como objeto Cliente — el bug típico
 * era pasar el nombre y luego leer `.nombre`/apellidos (vacío en entity-summary).
 */
export function labelDueñoDesdeDialogData(
  data:
    | {
        cliente?: string | Cliente | null;
        cliente_nombre?: string;
        nombreCliente?: string;
      }
    | null
    | undefined
): string {
  if (!data) return '';
  const c = data.cliente;
  if (typeof c === 'string' && c.trim()) return c.trim();
  if (c && typeof c === 'object') {
    const fromObj = getClienteNombreCompleto(c);
    if (fromObj) return fromObj;
  }
  return String(data.cliente_nombre || data.nombreCliente || '').trim();
}
