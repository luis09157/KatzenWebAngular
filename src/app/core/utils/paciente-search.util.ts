import { Paciente } from '../models';
import { calcularEdadPaciente } from '../../pacientes/paciente-fecha.util';
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

/** displayWith: Paciente seleccionado u string al tipear (mismo patrón que dueño). */
export function displayPacienteAutocompleteValue(value: Paciente | string | null | undefined): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  return getPacienteDisplayLabel(value);
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
  return (pacientes || []).filter((p) => {
    if (p?.activo === false) {
      return false;
    }
    const haystack = [getPacienteNombre(p), nombreDueno(p), p.especie, p.raza].filter(Boolean).join(' ');
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
  const delCliente = (pacientes || []).filter((p) => pacientePerteneceACliente(p, clienteId) && isPacienteActivo(p));

  if (!query || typeof query !== 'string') {
    return delCliente;
  }

  const filterValue = query.toLowerCase().trim();
  if (!filterValue) {
    return delCliente;
  }

  return delCliente.filter((paciente) => {
    const haystack = [getPacienteNombre(paciente), paciente.especie, paciente.raza].filter(Boolean).join(' ');
    return textoCoincide(haystack, filterValue);
  });
}

/**
 * Etiqueta de opción en picker: «Nombre — especie · Dueño» (dueño opcional).
 * Spec 085 / 029 follow-up — búsqueda dual mascota o dueño.
 */
export function getPacientePickerOptionLabel(paciente: Paciente | null | undefined, nombreDueno?: string): string {
  const base = getPacienteDisplayLabel(paciente);
  if (!base) return '';
  const dueno = String(nombreDueno || '').trim();
  return dueno ? `${base} · ${dueno}` : base;
}

/** Peluquería: raza y edad, sin el nombre del dueño. */
export function getPacientePickerRazaEdadLabel(paciente: Paciente | null | undefined): string {
  const base = getPacienteDisplayLabel(paciente);
  if (!base || !paciente) return '';
  const raza = String(paciente.raza || '').trim() || 'Sin raza';
  const edad = calcularEdadPaciente(paciente.edad);
  return `${base} · ${raza} · ${edad}`;
}

/**
 * Filtro del picker con búsqueda dual:
 * - Con dueño elegido → mascotas de ese cliente (texto opcional).
 * - Sin dueño → busca en todas las activas por nombre/dueño (query vacío → []).
 */
export function filtrarPacientesPickerDual(
  pacientes: Paciente[],
  clienteId: string | null | undefined,
  query: unknown,
  nombreDueno: (p: Paciente) => string
): Paciente[] {
  if (clienteId) {
    return filtrarPacientesDelCliente(pacientes, clienteId, query);
  }
  return filtrarPacientesPorTexto(
    (pacientes || []).filter((p) => isPacienteActivo(p)),
    query,
    nombreDueno
  );
}
