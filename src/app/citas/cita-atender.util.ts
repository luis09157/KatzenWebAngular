/** Spec 070 — Atender desde cita: expediente si hay mascota ligada. */
export function pacienteIdDeCita(cita: { paciente_id?: string; idPaciente?: string } | null | undefined): string {
  return String(cita?.paciente_id || cita?.idPaciente || '').trim();
}

export function puedeAtenderCita(cita: { paciente_id?: string; idPaciente?: string } | null | undefined): boolean {
  return !!pacienteIdDeCita(cita);
}

export const TOOLTIP_ATENDER_SIN_PACIENTE = 'Esta cita no tiene mascota ligada';
