import { Paciente } from '../models';
import { pacientePerteneceACliente } from './paciente-cliente.util';

export function isPacienteActivo(paciente: Paciente | null | undefined): boolean {
  if (!paciente || paciente.activo === false) return false;
  const estado = String(paciente.estado || '').toLowerCase();
  return estado !== 'fallecido';
}

/** Etiqueta de paciente para selects: nombre — especie. */
export function getPacienteDisplayLabel(paciente: Paciente | null | undefined): string {
  if (!paciente) return '';
  const nombre = paciente.nombre || 'Sin nombre';
  const especie = paciente.especie || 'Sin especie';
  return `${nombre} — ${especie}`;
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
    const nombre = (paciente.nombre || '').toLowerCase();
    const especie = (paciente.especie || '').toLowerCase();
    const raza = (paciente.raza || '').toLowerCase();

    const palabrasNombre = nombre.split(' ').filter(Boolean);
    const coincidePorPalabras = palabrasNombre.some(
      palabra => palabra.includes(filterValue) || filterValue.includes(palabra)
    );

    return (
      nombre.includes(filterValue) ||
      coincidePorPalabras ||
      especie.includes(filterValue) ||
      raza.includes(filterValue)
    );
  });
}
