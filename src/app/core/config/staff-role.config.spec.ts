import {
  navModulesForStaffRole,
  staffRoleShowsCompactNav,
  modulesForStaffRole
} from './staff-role.config';

describe('STAFF_NAV_COMPACT (054)', () => {
  it('recepcionista ve menú corto con ticket y citas, no inventario', () => {
    const nav = navModulesForStaffRole('recepcionista');
    expect(nav).toContain('visitas');
    expect(nav).toContain('citas');
    expect(nav).toContain('clientes');
    expect(nav).toContain('pacientes-admin');
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

  it('doctor y admin siguen con menú completo (011)', () => {
    expect(staffRoleShowsCompactNav('doctor')).toBeFalse();
    expect(navModulesForStaffRole('doctor')).toEqual(modulesForStaffRole('doctor'));
    expect(navModulesForStaffRole('administrador')).toContain('inventario');
    expect(navModulesForStaffRole('administrador')).toContain('usuarios');
    expect(navModulesForStaffRole('administrador')).toContain('servicios-clinica');
  });

  it('recepcionista no ve servicios de clínica en el menú compacto', () => {
    expect(navModulesForStaffRole('recepcionista')).not.toContain('servicios-clinica');
  });
});
