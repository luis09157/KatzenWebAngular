import { FormGroup } from '@angular/forms';

/** Nombres de controles cliente/paciente en un FormGroup (varía por módulo). */
export interface FlowHintClientePacienteFields {
  clienteId: string;
  pacienteId: string;
}

/**
 * Mensaje contextual dueño → mascota (spec 048).
 * Devuelve cadena vacía si ambos están listos.
 */
export function mensajeHintClientePaciente(
  form: FormGroup | null | undefined,
  fields: FlowHintClientePacienteFields,
  pasoTrasPaciente = ''
): string {
  if (!form) return '';
  const clienteId = String(form.get(fields.clienteId)?.value ?? '').trim();
  const pacienteId = String(form.get(fields.pacienteId)?.value ?? '').trim();
  if (!clienteId) {
    return 'Paso 1: selecciona o crea el dueño.';
  }
  if (!pacienteId) {
    return 'Paso 2: elige la mascota del dueño.';
  }
  return pasoTrasPaciente;
}
