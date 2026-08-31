import { Paciente } from '../models';
import { pacientePerteneceACliente } from './paciente-cliente.util';
import { pickLegacyString } from './rtdb-row.util';
import { textoCoincide } from './text-search.util';

export function isPacienteActivo(paciente: Paciente | null | undefined): boolean {
  if (!paciente || paciente.activo === false) return false;
  const estado = String(paciente.estado || '').toLowerCase();
  return estado !== 'fallecido';
}

export function getPacienteNombre(paciente: Paciente | null | undefined): string {
  if (!paciente) return '';
  return pickLegacyString(paciente as Record<string, unknown>, 'nombre', 'Nombre');
}

/** Etiqueta de paciente para selects: nombre — especie. */
export function getPacienteDisplayLabel(paciente: Paciente | null | undefined): string {
  if (!paciente) return '';
  const nombre = getPacienteNombre(paciente) || 'Sin nombre';
  const especie = paciente.especie || 'Sin especie';
  return `${nombre} — ${especie}`;
}

/**
 * Búsqueda de expediente (Buscar paciente): mascota o dueño.
 * Query vacío → ninguna sugerencia (el staff debe escribir).
 */
export function filtrarPacientesPorTexto(
  pacientes: Paciente[],
  query: unknown,
  nombreDueno: (p: Paciente) => string
): Paciente[] {
  const term = String(query ?? '').trim();
  if (!term) {
    return [];
  }
  return (pacientes || []).filter(p => {
    if (p?.activo === false) {
      return false;
    }
    const haystack = [getPacienteNombre(p), nombreDueno(p), p.especie, p.raza]
      .filter(Boolean)
      .join(' ');
    return textoCoincide(haystack, term);
  });
}

/**
 * Pacientes activos del cliente, opcionalmente filtrados por texto (nombre, especie, raza).
 */
export function filtrarPacientesDelCliente(
  pacientes: Paciente[],
  clienteId: string | null | undefined,
  query: unknown
): Paciente[] {
  const delCliente = (pacientes || []).filter(
    p => pacientePerteneceACliente(p, clienteId) && isPacienteActivo(p)
  );

  if (!query || typeof query !== 'string') {
    return delCliente;
  }

  const filterValue = query.toLowerCase().trim();
  if (!filterValue) {
    return delCliente;
  }

  return delCliente.filter(paciente => {
    const haystack = [getPacienteNombre(paciente), paciente.especie, paciente.raza]
      .filter(Boolean)
      .join(' ');
    return textoCoincide(haystack, filterValue);
  });
}
