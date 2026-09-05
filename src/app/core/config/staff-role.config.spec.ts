import {
  mensajeAccesoDenegadoModulo,
  modulesForStaffRole,
  navModulesForStaffRole,
  staffRoleCanAccessModule,
  staffRoleSeesOwnerDashboard,
  staffRoleShowsCompactNav,
} from './staff-role.config';

describe('STAFF_NAV_COMPACT + ACCESS (072)', () => {
  it('recepcionista ve menú corto con ticket y citas, no inventario', () => {
    const nav = navModulesForStaffRole('recepcionista');
    expect(nav).toContain('visitas');
    expect(nav).toContain('citas');
    expect(nav).toContain('clientes');
    expect(nav).toContain('paciente');
    expect(nav).not.toContain('pacientes-admin');
    expect(nav).not.toContain('inventario');
    expect(nav).not.toContain('finanzas');
    expect(nav).not.toContain('usuarios');
    expect(staffRoleShowsCompactNav('recepcionista')).toBeTrue();
  });

  it('peluquero no ve historiales ni inventario en el menú', () => {
    const nav = navModulesForStaffRole('peluquero');
    expect(nav).toContain('banios');
    expect(nav).toContain('visitas');
    expect(nav).not.toContain('historiales');
    expect(nav).not.toContain('inventario');
  });

  it('doctor usa menú compacto de 6 grupos (no catálogo admin)', () => {
    expect(staffRoleShowsCompactNav('doctor')).toBeTrue();
    const nav = navModulesForStaffRole('doctor');
    expect(nav).toContain('inicio');
    expect(nav).toContain('paciente');
    expect(nav).toContain('citas');
    expect(nav).toContain('visitas');
    expect(nav).toContain('recordatorios');
    expect(nav).not.toContain('finanzas');
    expect(nav).not.toContain('usuarios');
    expect(nav).not.toContain('inventario');
    expect(nav).not.toEqual(modulesForStaffRole('administrador'));
  });

  it('admin sigue con menú completo e incluye configuración', () => {
    expect(staffRoleShowsCompactNav('administrador')).toBeFalse();
    expect(navModulesForStaffRole('administrador')).toContain('inventario');
    expect(navModulesForStaffRole('administrador')).toContain('usuarios');
    expect(navModulesForStaffRole('administrador')).toContain('servicios-clinica');
    expect(navModulesForStaffRole('administrador')).toContain('configuracion');
  });

  it('recepcionista no ve servicios de clínica en el menú compacto', () => {
    expect(navModulesForStaffRole('recepcionista')).not.toContain('servicios-clinica');
  });

  it('URL: recepción y doctor no entran a finanzas ni personal', () => {
    expect(staffRoleCanAccessModule('recepcionista', 'finanzas')).toBeFalse();
    expect(staffRoleCanAccessModule('recepcionista', 'usuarios')).toBeFalse();
    expect(staffRoleCanAccessModule('recepcionista', 'visitas')).toBeTrue();
    expect(staffRoleCanAccessModule('recepcionista', 'citas')).toBeTrue();
    expect(staffRoleCanAccessModule('recepcionista', 'paciente')).toBeTrue();
    expect(staffRoleCanAccessModule('recepcionista', 'recordatorios')).toBeTrue();
    expect(staffRoleCanAccessModule('doctor', 'finanzas')).toBeFalse();
    expect(staffRoleCanAccessModule('doctor', 'usuarios')).toBeFalse();
    expect(staffRoleCanAccessModule('doctor', 'historiales')).toBeTrue();
    expect(staffRoleCanAccessModule('doctor', 'visitas')).toBeTrue();
  });

  it('URL: peluquero no entra a finanzas, personal ni inventario', () => {
    expect(staffRoleCanAccessModule('peluquero', 'finanzas')).toBeFalse();
    expect(staffRoleCanAccessModule('peluquero', 'usuarios')).toBeFalse();
    expect(staffRoleCanAccessModule('peluquero', 'inventario')).toBeFalse();
    expect(staffRoleCanAccessModule('peluquero', 'banios')).toBeTrue();
    expect(staffRoleCanAccessModule('peluquero', 'visitas')).toBeTrue();
  });

  it('owner-dash solo admin/dueño', () => {
    expect(staffRoleSeesOwnerDashboard('administrador')).toBeTrue();
    expect(staffRoleSeesOwnerDashboard('dueño')).toBeTrue();
    expect(staffRoleSeesOwnerDashboard('super_admin')).toBeTrue();
    expect(staffRoleSeesOwnerDashboard('doctor')).toBeFalse();
    expect(staffRoleSeesOwnerDashboard('recepcionista')).toBeFalse();
    expect(staffRoleSeesOwnerDashboard('peluquero')).toBeFalse();
  });

  it('mensaje de guard es humano', () => {
    expect(mensajeAccesoDenegadoModulo('finanzas')).toContain('administración');
    expect(mensajeAccesoDenegadoModulo('usuarios')).toContain('personal');
    expect(mensajeAccesoDenegadoModulo('finanzas')).not.toMatch(/RTDB|claims|Firebase/i);
  });

  it('rol desconocido no abre finanzas (cae a clínico+POS)', () => {
    expect(staffRoleCanAccessModule('practicante', 'finanzas')).toBeFalse();
    expect(staffRoleCanAccessModule('practicante', 'visitas')).toBeTrue();
  });
});
