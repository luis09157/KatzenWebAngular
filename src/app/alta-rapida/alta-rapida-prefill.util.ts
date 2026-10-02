/** Prefill / picker desde «Llegó un paciente» (spec 070 / 085). Sin imports de diálogos. */

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
