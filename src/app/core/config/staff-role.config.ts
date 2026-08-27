/** Módulos del panel admin (coinciden con rutas /admin/{modulo}). */
export type StaffModule =
  | 'inicio'
  | 'paciente'
  | 'pacientes-admin'
  | 'clientes'
  | 'contactos-web'
  | 'citas'
  | 'historiales'
  | 'vacunas'
  | 'recordatorios'
  | 'banios'
  | 'inventario'
  | 'finanzas'
  | 'pension'
  | 'visitas'
  | 'usuarios';

export const ALL_STAFF_MODULES: StaffModule[] = [
  'inicio',
  'paciente',
  'pacientes-admin',
  'clientes',
  'contactos-web',
  'citas',
  'historiales',
  'vacunas',
  'recordatorios',
  'banios',
  'inventario',
  'finanzas',
  'pension',
  'visitas',
  'usuarios'
];

/**
 * Matriz rol → módulos permitidos. `*` = acceso total.
 * Política 011 (2026-08-26): todo staff (excepto portal client) tiene acceso admin
 * unificado; el rol solo identifica organización/identidad.
 */
export const STAFF_MODULE_ACCESS: Record<string, StaffModule[] | '*'> = {
  administrador: '*',
  admin: '*',
  doctor: '*',
  recepcionista: '*',
  peluquero: '*',
  /** Dueño del sistema / desarrollador (alias operativo de acceso total). */
  super_admin: '*',
  dueno: '*',
  dueño: '*'
};

export function mapUsuarioPerfilToStaffRole(perfil: string | undefined | null): string {
  const p = String(perfil || '').toLowerCase();
  if (p === 'admin' || p === 'administrador') return 'administrador';
  if (p === 'super_admin' || p === 'superadmin') return 'super_admin';
  if (p === 'dueno' || p === 'dueño' || p === 'duena' || p === 'dueña') return 'super_admin';
  if (p === 'doctor') return 'doctor';
  if (p === 'recepcionista') return 'recepcionista';
  if (p === 'peluquero') return 'peluquero';
  return p || 'doctor';
}

export function normalizeStaffRole(role: string | undefined | null): string {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'administrador';
  if (r === 'superadmin') return 'super_admin';
  if (r === 'dueno' || r === 'dueño' || r === 'duena' || r === 'dueña') return 'super_admin';
  return r;
}

export function modulesForStaffRole(staffRole: string): StaffModule[] {
  const role = normalizeStaffRole(staffRole);
  const access = STAFF_MODULE_ACCESS[role];
  if (access === '*') {
    return ALL_STAFF_MODULES;
  }
  if (Array.isArray(access)) {
    return access;
  }
  // Rol staff desconocido: acceso admin completo (política 011)
  return ALL_STAFF_MODULES;
}

export function staffRoleCanAccessModule(staffRole: string, module: StaffModule): boolean {
  const role = normalizeStaffRole(staffRole);
  const access = STAFF_MODULE_ACCESS[role];
  if (access === '*') {
    return true;
  }
  if (Array.isArray(access)) {
    return access.includes(module);
  }
  // Rol desconocido staff → permitir (política unificada)
  return true;
}

/**
 * Veterinarias / admin operativo: fechas pasadas en agenda y revertir
 * completada → confirmada (domain-context decisiones #3 y #5).
 */
export function staffRoleIsVeterinarioOperativo(staffRole: string | undefined | null): boolean {
  const role = normalizeStaffRole(staffRole);
  return role === 'administrador' || role === 'doctor' || role === 'super_admin';
}
