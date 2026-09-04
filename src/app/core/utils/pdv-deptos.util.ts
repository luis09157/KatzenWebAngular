/**
 * Spec 064 — departamentos reales de `DEPARTAMENTOS` (isql 2026-08-31).
 * No usar `DEPTS.NOMBRE` (viene ofuscado).
 */

export interface DeptoPdv {
  id: number;
  nombre: string;
  activo: boolean;
}

/** Catálogo FDB KATZEN-VET. Fuente: SELECT * FROM DEPARTAMENTOS. */
export const PDV_DEPARTAMENTOS_FDB: DeptoPdv[] = [
  { id: 0, nombre: '- Sin Departamento -', activo: true },
  { id: 2, nombre: 'Consultorio', activo: true },
  { id: 3, nombre: 'Alimento', activo: true },
  { id: 4, nombre: 'Medicamento (Eliminado 04/04/2024)', activo: false },
  { id: 5, nombre: 'Petshop', activo: true },
  { id: 6, nombre: 'Premios (Eliminado 02/08/2023)', activo: false },
  { id: 7, nombre: 'Grooming', activo: true },
  { id: 8, nombre: 'Paquetes', activo: true },
  { id: 9, nombre: 'Exámenes de laborat. (Eliminado 04/04/2024)', activo: false },
  { id: 10, nombre: 'USOINTERNO (Eliminado 01/04/2024)', activo: false },
  { id: 11, nombre: 'Ropa', activo: true },
  { id: 12, nombre: 'Farmacia', activo: true },
  { id: 13, nombre: 'UsoInterno', activo: true },
  { id: 14, nombre: 'Equipo', activo: true }
];

const BY_ID = new Map(PDV_DEPARTAMENTOS_FDB.map((d) => [d.id, d]));

export function nombreDepartamentoPdv(
  deptId: unknown,
  override?: string | null
): string {
  const named = String(override || '').trim();
  if (named) return named;
  if (deptId === null || deptId === undefined || deptId === '') return '';
  const id = Number(deptId);
  if (!Number.isFinite(id)) return '';
  return BY_ID.get(id)?.nombre || '';
}

export function enriquecerFilaDepartamento<T extends { dept?: unknown; departamento?: string | null }>(
  row: T
): T & { departamento: string } {
  return {
    ...row,
    departamento: nombreDepartamentoPdv(row.dept, row.departamento)
  };
}
