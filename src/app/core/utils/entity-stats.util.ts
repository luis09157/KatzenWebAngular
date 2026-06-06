import { filterBySucursal } from './sucursal-filter.util';

export interface ClienteEstadisticas {
  total: number;
  conCorreo: number;
  conExpediente: number;
}

export interface PacienteEstadisticas {
  total: number;
  duenosUnicos: number;
  perros: number;
  gatos: number;
  /** IDs de clientes que tienen al menos un paciente activo (en sucursal). */
  clienteIdsConPaciente: Set<string>;
}

function isEspeciePerro(especie?: string): boolean {
  const e = String(especie || '').toLowerCase();
  return e.includes('perro') || e.includes('canino') || e.includes('dog');
}

function isEspecieGato(especie?: string): boolean {
  const e = String(especie || '').toLowerCase();
  return e.includes('gato') || e.includes('felino') || e.includes('cat');
}

export function calcularClienteEstadisticas<T extends {
  activo?: boolean;
  correo?: string;
  expediente?: string;
  sucursalId?: string;
}>(clientes: T[], sucursalId: string): ClienteEstadisticas {
  const activos = filterBySucursal(
    clientes.filter(c => c.activo !== false),
    sucursalId
  );
  return {
    total: activos.length,
    conCorreo: activos.filter(c => c.correo && c.correo.trim() !== '').length,
    conExpediente: activos.filter(c => c.expediente && c.expediente.trim() !== '').length
  };
}

export function calcularClientesConPacientes<T extends {
  id?: string;
  activo?: boolean;
  sucursalId?: string;
}>(
  clientes: T[],
  clienteIdsConPaciente: Set<string>,
  sucursalId: string
): number {
  const activos = filterBySucursal(
    clientes.filter(c => c.activo !== false),
    sucursalId
  );
  return activos.filter(c => c.id && clienteIdsConPaciente.has(c.id)).length;
}

export function calcularPacienteEstadisticas<T extends {
  activo?: boolean;
  especie?: string;
  idCliente?: string;
  cliente_id?: string;
  sucursalId?: string;
}>(pacientes: T[], sucursalId: string): PacienteEstadisticas {
  const activos = filterBySucursal(
    pacientes.filter(p => p.activo !== false),
    sucursalId
  );
  const clienteIds = activos
    .map(p => p.cliente_id || p.idCliente)
    .filter((id): id is string => !!id);

  return {
    total: activos.length,
    duenosUnicos: new Set(clienteIds).size,
    perros: activos.filter(p => isEspeciePerro(p.especie)).length,
    gatos: activos.filter(p => isEspecieGato(p.especie)).length,
    clienteIdsConPaciente: new Set(clienteIds)
  };
}
