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
  'usuarios'
];

/** Matriz rol → módulos permitidos. `*` = acceso total. */
export const STAFF_MODULE_ACCESS: Record<string, StaffModule[] | '*'> = {
  administrador: '*',
  admin: '*',
  doctor: [
    'inicio',
    'paciente',
    'pacientes-admin',
    'clientes',
    'citas',
    'historiales',
    'vacunas',
    'recordatorios',
    'banios'
  ],
  recepcionista: [
    'inicio',
    'paciente',
    'pacientes-admin',
    'clientes',
    'contactos-web',
    'citas',
    'recordatorios',
    'banios'
  ],
  peluquero: ['inicio', 'paciente', 'banios']
};

export function mapUsuarioPerfilToStaffRole(perfil: string | undefined | null): string {
  const p = String(perfil || '').toLowerCase();
  if (p === 'admin' || p === 'administrador') return 'administrador';
  if (p === 'doctor') return 'doctor';
  if (p === 'recepcionista') return 'recepcionista';
  if (p === 'peluquero') return 'peluquero';
  return p || 'doctor';
}

export function normalizeStaffRole(role: string | undefined | null): string {
  const r = String(role || '').toLowerCase();
  if (r === 'admin') return 'administrador';
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
  return STAFF_MODULE_ACCESS.doctor as StaffModule[];
}

export function staffRoleCanAccessModule(staffRole: string, module: StaffModule): boolean {
  const role = normalizeStaffRole(staffRole);
  const access = STAFF_MODULE_ACCESS[role];
  if (access === '*') {
    return true;
  }
  return (access || []).includes(module);
}
