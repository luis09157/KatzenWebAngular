/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAdmin(): Chainable<void>;
      /**
       * Login staff por rol smoke 008.
       * Credenciales: Cypress.env(`${role}Email` / `${role}Password`)
       * roles: doctor | recepcionista | peluquero
       */
      loginStaffRole(role: 'doctor' | 'recepcionista' | 'peluquero'): Chainable<void>;
      /** Navegación SPA sin recargar (preserva sesión Firebase). */
      navigateAdmin(path: string): Chainable<void>;
      /** Navega a un módulo admin sin recargar (sidenav o sub-rutas de inventario). */
      visitAdminModule(path: string): Chainable<void>;
      confirmSwal(): Chainable<void>;
      dismissSwalSuccess(): Chainable<void>;
      /** Cierra Swal con confirm o espera timer (showConfirmButton: false). */
      dismissSwalAny(): Chainable<void>;
      openPacienteExpediente(searchTerm?: string): Chainable<void>;
      fillClienteFormBasico(options: {
        nombre: string;
        apellidoPaterno: string;
        telefono: string;
        correo?: string;
      }): Chainable<void>;
    }
  }
}

export function requireAdminCredentials(): void {
  const email = Cypress.env('adminEmail');
  const password = Cypress.env('adminPassword');
  if (!email || !password) {
    throw new Error(
      'Faltan credenciales E2E. Copia cypress.env.example.json → cypress.env.json y configura adminEmail / adminPassword.'
    );
  }
}

function loginWithCredentials(email: string, password: string): void {
  cy.visit('/admin/login');
  cy.get('input[name="email"]', { timeout: 15000 }).should('be.visible').click({ force: true }).clear({ force: true }).type(email, { force: true });
  cy.get('input[name="password"]').click({ force: true }).clear({ force: true }).type(password, { log: false, force: true });
  // Evita race AuthGuard en cy.visit a módulos: sesión LOCAL + auto-redirect desde login
  cy.get('mat-checkbox.admin-auth-remember input[type="checkbox"]').check({ force: true });
  cy.get('button[type="submit"].admin-auth-submit').contains('Iniciar sesión').click();

  // Dual (012): selector de contexto → elegir panel admin
  cy.url({ timeout: 45000 }).should('match', /\/(auth\/contexto|admin\/(inicio|clientes))/);
  cy.location('pathname').then(pathname => {
    if (pathname.includes('/auth/contexto')) {
      cy.contains('button', 'Panel admin', { timeout: 15000 }).click({ force: true });
    }
  });

  cy.url({ timeout: 45000 }).should('match', /\/admin\/(inicio|clientes)/);
  cy.get('body').then($body => {
    if ($body.find('.swal2-popup:visible').length) {
      const msg = $body.find('.swal2-html-container').text().trim();
      throw new Error(`Login no completado: ${msg || 'error desconocido'}`);
    }
  });
  cy.get('mat-sidenav', { timeout: 20000 }).should('exist');
}

Cypress.Commands.add('loginAdmin', () => {
  requireAdminCredentials();
  const email = Cypress.env('adminEmail') as string;
  const password = Cypress.env('adminPassword') as string;
  loginWithCredentials(email, password);
});

Cypress.Commands.add('loginStaffRole', (role: 'doctor' | 'recepcionista' | 'peluquero') => {
  const email = Cypress.env(`${role}Email`) as string | undefined;
  const password = Cypress.env(`${role}Password`) as string | undefined;
  if (!email || !password) {
    throw new Error(
      `Faltan credenciales smoke para rol "${role}". Ejecuta: node scripts/smoke-008-provision-roles.mjs provision`
    );
  }
  loginWithCredentials(email, password);
});

Cypress.Commands.add('navigateAdmin', (path: string) => {
  cy.get('body').then($body => {
    const $nav = $body.find('mat-sidenav.admin-sidenav');
    const hidden =
      $nav.length > 0 &&
      ($nav.css('display') === 'none' || !$nav.hasClass('mat-drawer-opened'));
    if (hidden) {
      cy.get('.m3-top-bar button[mat-icon-button]').first().click({ force: true });
    }
  });
  cy.get(`a[routerLink="${path}"]`, { timeout: 15000 }).should('exist').click({ force: true });
  cy.url({ timeout: 15000 }).should('include', path);
});

Cypress.Commands.add('visitAdminModule', (path: string) => {
  const inventarioSubRoute = path.match(/^\/admin\/inventario\/([^/]+)/);
  if (inventarioSubRoute) {
    cy.navigateAdmin('/admin/inventario');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    const cardTitles: Record<string, string> = {
      productos: 'Productos',
      movimientos: 'Movimientos',
      proveedores: 'Proveedores',
      ordenes: 'Órdenes de compra',
      alertas: 'Alertas',
      reportes: 'Reportes'
    };
    const cardTitle = cardTitles[inventarioSubRoute[1]] || inventarioSubRoute[1];
    cy.contains('.feature-card__title', cardTitle, { timeout: 15000 }).click({ force: true });
    cy.url({ timeout: 15000 }).should('include', path);
    return;
  }

  cy.navigateAdmin(path);
});

Cypress.Commands.add('openPacienteExpediente', (searchTerm?: string) => {
  const term = searchTerm || Cypress.env('e2ePacienteSearch') || 'Oreon';
  cy.navigateAdmin('/admin/paciente');
  cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
  cy.get('.pacientes-search__field input', { timeout: 15000 })
    .should('be.visible')
    .clear({ force: true })
    .type(term, { force: true });
  cy.get('mat-option', { timeout: 15000 }).first().click({ force: true });
  cy.get('.expediente-layout', { timeout: 20000 }).should('exist');
});

Cypress.Commands.add('confirmSwal', () => {
  cy.get('body').then($body => {
    if ($body.find('.swal2-popup:visible').length) {
      cy.get('.swal2-confirm:visible').click({ force: true });
    }
  });
});

Cypress.Commands.add('dismissSwalSuccess', () => {
  cy.get('body').should('have.class', 'swal2-shown');
  cy.get('.global-loading-overlay', { timeout: 30000 }).should('not.exist');
  cy.get('.swal2-confirm').should('exist').click({ force: true, multiple: true });
  cy.get('body', { timeout: 15000 }).should('not.have.class', 'swal2-shown');
});

Cypress.Commands.add('dismissSwalAny', () => {
  cy.get('.swal2-popup', { timeout: 30000 }).should('be.visible');
  cy.get('.global-loading-overlay', { timeout: 30000 }).should('not.exist');
  cy.get('body').then($body => {
    if ($body.find('.swal2-confirm').length) {
      cy.get('.swal2-confirm').click({ force: true, multiple: true });
    }
  });
  cy.get('body', { timeout: 15000 }).should('not.have.class', 'swal2-shown');
});

Cypress.Commands.add('fillClienteFormBasico', (options) => {
  cy.get('mat-dialog-container').should('be.visible');
  cy.get('input[formControlName="nombre"]').click({ force: true }).clear({ force: true }).type(options.nombre, { force: true });
  cy.get('input[formControlName="apellidoPaterno"]').click({ force: true }).clear({ force: true }).type(options.apellidoPaterno, { force: true });
  cy.get('mat-select[formControlName="genero"]').click({ force: true });
  cy.get('mat-option').contains('Masculino').click({ force: true });
  cy.get('input[formControlName="telefono"]').click({ force: true }).clear({ force: true }).type(options.telefono, { force: true });
  if (options.correo) {
    cy.get('input[formControlName="correo"]').click({ force: true }).clear({ force: true }).type(options.correo, { force: true });
  }
});

export {};
