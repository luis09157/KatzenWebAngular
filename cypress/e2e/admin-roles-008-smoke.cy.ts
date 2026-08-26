/**
 * Smoke UI multi-rol — Spec 008 (doctor / recepcionista / peluquero).
 * Requiere credenciales en cypress.env.json (provision via scripts/smoke-008-provision-roles.mjs).
 * No persiste writes: diálogos se cancelan; módulos denegados → redirect /admin/inicio.
 *
 * Escrituras RTDB DENIED se validan aparte con:
 *   node scripts/smoke-008-provision-roles.mjs rtdb-probe
 */
describe('Admin roles 008 smoke', () => {
  /**
   * Módulo denegado no debe quedar accesible.
   * Con login + «Mantener sesión activa»: hard visit puede pasar por race AuthGuard→login
   * y luego restore a /admin/inicio; o StaffRoleGuard redirige a inicio. Ambos OK.
   */
  const denyRedirect = (path: string) => {
    cy.visit(path);
    cy.url({ timeout: 45000 }).should('include', '/admin/inicio');
    cy.get('mat-sidenav', { timeout: 20000 }).should('exist');
  };

  const expectNav = (path: string, visible: boolean) => {
    cy.get('mat-sidenav mat-nav-list a[routerLink="' + path + '"]').should(
      visible ? 'exist' : 'not.exist'
    );
  };

  describe('Doctor', () => {
    beforeEach(() => {
      cy.loginStaffRole('doctor');
    });

    it('A2.1 login y menú clínico sin inventario/usuarios', () => {
      expectNav('/admin/citas', true);
      expectNav('/admin/historiales', true);
      expectNav('/admin/banios', true);
      expectNav('/admin/inventario', false);
      expectNav('/admin/usuarios', false);
      expectNav('/admin/contactos-web', false);
    });

    it('A2.2 citas R/W UI (diálogo Nueva cita → cerrar)', () => {
      cy.visitAdminModule('/admin/citas');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.contains('button', 'Nueva cita').click();
      cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
      cy.get('mat-dialog-container button').contains('Cerrar').click({ force: true });
      cy.get('mat-dialog-container').should('not.exist');
    });

    it('A2.3 historiales lectura + flujo Nuevo alcanzable', () => {
      cy.visitAdminModule('/admin/historiales');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.get('.historiales-contenedor', { timeout: 20000 }).should('exist');
      cy.contains('button', /Nuevo|nuevo historial/i).should('exist');
    });

    it('A2.4 inventario denegado en UI (guard → inicio)', () => {
      denyRedirect('/admin/inventario');
    });

    it('A2.6 baños R/W UI (diálogo)', () => {
      cy.visitAdminModule('/admin/banios');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.contains('button', /Nuevo baño|Nuevo/i).click({ force: true });
      cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
      cy.get('mat-dialog-container button').contains(/Cerrar|Cancelar/i).click({ force: true });
      cy.get('mat-dialog-container').should('not.exist');
    });
  });

  describe('Recepcionista', () => {
    beforeEach(() => {
      cy.loginStaffRole('recepcionista');
    });

    it('B.1 login → citas / clientes / baños / recordatorios; sin historiales/inventario', () => {
      expectNav('/admin/citas', true);
      expectNav('/admin/clientes', true);
      expectNav('/admin/banios', true);
      expectNav('/admin/recordatorios', true);
      expectNav('/admin/historiales', false);
      expectNav('/admin/inventario', false);
      expectNav('/admin/vacunas', false);
      expectNav('/admin/usuarios', false);
    });

    it('B.2 citas R/W UI', () => {
      cy.visitAdminModule('/admin/citas');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.contains('button', 'Nueva cita').click();
      cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
      cy.get('mat-dialog-container button').contains('Cerrar').click({ force: true });
    });

    it('B.3 historiales módulo denegado (UI)', () => {
      denyRedirect('/admin/historiales');
    });

    it('B.4 inventario denegado (UI)', () => {
      denyRedirect('/admin/inventario');
    });

    it('B.5 baños R/W UI', () => {
      cy.visitAdminModule('/admin/banios');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.contains('button', /Nuevo baño|Nuevo/i).click({ force: true });
      cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
      cy.get('mat-dialog-container button').contains(/Cerrar|Cancelar/i).click({ force: true });
    });

    it('B.6 vacunas módulo denegado (UI)', () => {
      denyRedirect('/admin/vacunas');
    });
  });

  describe('Peluquero', () => {
    beforeEach(() => {
      cy.loginStaffRole('peluquero');
    });

    it('C.1 login → solo inicio / paciente / baños', () => {
      expectNav('/admin/inicio', true);
      expectNav('/admin/paciente', true);
      expectNav('/admin/banios', true);
      expectNav('/admin/citas', false);
      expectNav('/admin/historiales', false);
      expectNav('/admin/inventario', false);
      expectNav('/admin/clientes', false);
    });

    it('C.2 citas denegado (UI)', () => {
      denyRedirect('/admin/citas');
    });

    it('C.3 historiales denegado (UI)', () => {
      denyRedirect('/admin/historiales');
    });

    it('C.4 inventario denegado (UI)', () => {
      denyRedirect('/admin/inventario');
    });

    it('C.5 baños R/W UI', () => {
      cy.visitAdminModule('/admin/banios');
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.contains('button', /Nuevo baño|Nuevo/i).click({ force: true });
      cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
      cy.get('mat-dialog-container button').contains(/Cerrar|Cancelar/i).click({ force: true });
    });
  });
});
