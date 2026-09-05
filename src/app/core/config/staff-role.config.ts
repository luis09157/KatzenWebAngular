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
  | 'consentimientos'
  | 'usuarios'
  | 'servicios-clinica'
  | 'configuracion';

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
  'consentimientos',
  'usuarios',
  'servicios-clinica',
  'configuracion',
];

/** Clínico + POS (vet / recepción). Sin finanzas, personal, inventario admin ni config. */
export const STAFF_MODULES_CLINICO_POS: StaffModule[] = [
  'inicio',
  'paciente',
  'clientes',
  'citas',
  'historiales',
  'vacunas',
  'recordatorios',
  'banios',
  'pension',
  'visitas',
  'consentimientos',
];

export const STAFF_MODULES_PELUQUERO: StaffModule[] = [
  'inicio',
  'paciente',
  'clientes',
  'citas',
  'banios',
  'visitas',
  'recordatorios',
];

/**
 * Matriz rol → módulos permitidos por URL (spec 072).
 * Admin/dueño: acceso total. El resto ya no es `*` (cierra el hueco de 011).
 */
export const STAFF_MODULE_ACCESS: Record<string, StaffModule[] | '*'> = {
  administrador: '*',
  admin: '*',
  doctor: STAFF_MODULES_CLINICO_POS,
  recepcionista: STAFF_MODULES_CLINICO_POS,
  peluquero: STAFF_MODULES_PELUQUERO,
  super_admin: '*',
  dueno: '*',
  dueño: '*',
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

export function staffRoleIsAdminOperativo(staffRole: string | undefined | null): boolean {
  const role = normalizeStaffRole(staffRole);
  return role === 'administrador' || role === 'super_admin';
}

/** 054 #3 / 072: ingresos, meta y tops solo dueño/admin. */
export function staffRoleSeesOwnerDashboard(staffRole: string | undefined | null): boolean {
  return staffRoleIsAdminOperativo(staffRole);
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
  return STAFF_MODULES_CLINICO_POS;
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
  return STAFF_MODULES_CLINICO_POS.includes(module);
}

/**
 * Menú compacto (spec 054 + 072). Doctor ya no ve el catálogo admin completo.
 */
export const STAFF_NAV_COMPACT: Record<string, StaffModule[] | '*'> = {
  recepcionista: [
    'inicio',
    'paciente',
    'citas',
    'clientes',
    'visitas',
    'banios',
    'recordatorios',
    'pension',
    'consentimientos',
    'historiales',
    'vacunas',
  ],
  peluquero: ['inicio', 'paciente', 'clientes', 'citas', 'banios', 'visitas', 'recordatorios'],
  doctor: [
    'inicio',
    'paciente',
    'citas',
    'visitas',
    'recordatorios',
    'banios',
    'pension',
    'clientes',
    'consentimientos',
    'historiales',
    'vacunas',
  ],
  administrador: '*',
  admin: '*',
  super_admin: '*',
  dueno: '*',
  dueño: '*',
};

/** Hijos de Agenda (no van sueltos al nivel de Cobrar). */
export const STAFF_NAV_AGENDA: StaffModule[] = ['citas', 'banios', 'pension'];

/** Ítems de Más (visibles según rol / nav). */
export const STAFF_NAV_MAS: StaffModule[] = [
  'clientes',
  'consentimientos',
  'historiales',
  'vacunas',
  'inventario',
  'servicios-clinica',
  'finanzas',
  'usuarios',
  'contactos-web',
  'configuracion',
];

export function staffRoleShowsCompactNav(staffRole: string | undefined | null): boolean {
  const role = normalizeStaffRole(staffRole);
  const nav = STAFF_NAV_COMPACT[role];
  return Array.isArray(nav);
}

export function navModulesForStaffRole(staffRole: string): StaffModule[] {
  const role = normalizeStaffRole(staffRole);
  const nav = STAFF_NAV_COMPACT[role];
  if (!nav || nav === '*') {
    return modulesForStaffRole(role);
  }
  return nav.filter((m) => staffRoleCanAccessModule(role, m));
}

/**
 * Veterinarias / admin operativo: fechas pasadas en agenda y revertir
 * completada → confirmada (domain-context decisiones #3 y #5).
 */
export function staffRoleIsVeterinarioOperativo(staffRole: string | undefined | null): boolean {
  const role = normalizeStaffRole(staffRole);
  return role === 'administrador' || role === 'doctor' || role === 'super_admin';
}

export function mensajeAccesoDenegadoModulo(module: StaffModule | string): string {
  switch (module) {
    case 'finanzas':
      return 'Caja y finanzas las ve administración. Te llevamos a Hoy.';
    case 'usuarios':
      return 'El personal lo administra la dueña o un administrador.';
    case 'inventario':
      return 'El inventario lo ve administración.';
    case 'configuracion':
      return 'La configuración de la clínica la cambia administración.';
    case 'servicios-clinica':
      return 'El catálogo de servicios lo edita administración.';
    case 'contactos-web':
      return 'Los mensajes de la página web los ve administración.';
    default:
      return 'No tienes acceso a esta pantalla. Te llevamos a Hoy.';
  }
}
