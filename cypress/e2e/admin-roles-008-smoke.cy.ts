/**
 * Smoke UI multi-rol — Spec 008 + política 011 (acceso admin unificado).
 * Requiere credenciales en cypress.env.json (provision via scripts/smoke-008-provision-roles.mjs).
 * No persiste writes: diálogos se cancelan.
 *
 * Spec 072: doctor / recepcionista / peluquero ya no tienen el mismo menú ni
 * acceso URL que administrador (Finanzas/Personal/Inventario según rol).
 * Este archivo histórico de 008/011 queda desactualizado; no usarlo como QA de 072.
 *
 * Escrituras RTDB operativas ALLOW se validan con:
 *   node scripts/smoke-008-provision-roles.mjs rtdb-probe
 */
describe('Admin roles 008 smoke', () => {
  const expectNav = (path: string, visible: boolean) => {
    cy.get('mat-sidenav mat-nav-list a[routerLink="' + path + '"]').should(visible ? 'exist' : 'not.exist');
  };

  /** Todos los módulos admin deben ser visibles para cualquier staff (política 011). */
  const expectFullAdminNav = () => {
    expectNav('/admin/inicio', true);
    expectNav('/admin/citas', true);
    expectNav('/admin/historiales', true);
    expectNav('/admin/vacunas', true);
    expectNav('/admin/inventario', true);
    expectNav('/admin/clientes', true);
    expectNav('/admin/banios', true);
    expectNav('/admin/usuarios', true);
    expectNav('/admin/contactos-web', true);
  };

  const openAndCloseDialog = (visitPath: string, buttonLabel: RegExp | string) => {
    cy.visitAdminModule(visitPath);
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('button', buttonLabel).click({ force: true });
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container button')
      .contains(/Cerrar|Cancelar/i)
      .click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  };

  describe('Doctor', () => {
    beforeEach(() => {
      cy.loginStaffRole('doctor');
    });

    it('A2.1 login y menú admin completo (política 011)', () => {
      expectFullAdminNav();
    });

    it('A2.2 citas R/W UI (diálogo Nueva cita → cerrar)', () => {
      openAndCloseDialog('/admin/citas', 'Nueva cita');
    });

    it('A2.3 historiales lectura + flujo Nuevo alcanzable', () => {
      cy.visitAdminModule('/admin/historiales');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.get('.historiales-contenedor', { timeout: 20000 }).should('exist');
      cy.contains('button', /Nuevo|nuevo historial/i).should('exist');
    });

    it('A2.4 inventario accesible (UI)', () => {
      cy.visitAdminModule('/admin/inventario');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/inventario');
      cy.get('.dashboard-inventario, .admin-page', { timeout: 20000 }).should('exist');
    });

    it('A2.6 baños R/W UI (diálogo)', () => {
      openAndCloseDialog('/admin/banios', /Nuevo baño|Nuevo/i);
    });
  });

  describe('Recepcionista', () => {
    beforeEach(() => {
      cy.loginStaffRole('recepcionista');
    });

    it('B.1 login → menú admin completo (política 011)', () => {
      expectFullAdminNav();
    });

    it('B.2 citas R/W UI', () => {
      openAndCloseDialog('/admin/citas', 'Nueva cita');
    });

    it('B.3 historiales módulo accesible (UI)', () => {
      cy.visitAdminModule('/admin/historiales');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/historiales');
      cy.get('.historiales-contenedor', { timeout: 20000 }).should('exist');
    });

    it('B.4 inventario accesible (UI)', () => {
      cy.visitAdminModule('/admin/inventario');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/inventario');
    });

    it('B.5 baños R/W UI', () => {
      openAndCloseDialog('/admin/banios', /Nuevo baño|Nuevo/i);
    });

    it('B.6 vacunas módulo accesible (UI)', () => {
      cy.visitAdminModule('/admin/vacunas');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/vacunas');
    });
  });

  describe('Peluquero', () => {
    beforeEach(() => {
      cy.loginStaffRole('peluquero');
    });

    it('C.1 login → menú admin completo (política 011)', () => {
      expectFullAdminNav();
    });

    it('C.2 citas accesible (UI)', () => {
      cy.visitAdminModule('/admin/citas');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/citas');
    });

    it('C.3 historiales accesible (UI)', () => {
      cy.visitAdminModule('/admin/historiales');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/historiales');
    });

    it('C.4 inventario accesible (UI)', () => {
      cy.visitAdminModule('/admin/inventario');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.url({ timeout: 20000 }).should('include', '/admin/inventario');
    });

    it('C.5 baños R/W UI', () => {
      openAndCloseDialog('/admin/banios', /Nuevo baño|Nuevo/i);
    });
  });
});
