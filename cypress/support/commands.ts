/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAdmin(): Chainable<void>;
      /** Navegación SPA sin recargar (preserva sesión Firebase). */
      navigateAdmin(path: string): Chainable<void>;
      confirmSwal(): Chainable<void>;
      dismissSwalSuccess(): Chainable<void>;
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

Cypress.Commands.add('loginAdmin', () => {
  requireAdminCredentials();
  const email = Cypress.env('adminEmail') as string;
  const password = Cypress.env('adminPassword') as string;

  cy.visit('/admin/login');
  cy.get('input[name="email"]', { timeout: 15000 }).should('be.visible').clear().type(email);
  cy.get('input[name="password"]').clear().type(password, { log: false });
  cy.get('button[type="submit"]').contains('Entrar').click();

  cy.url({ timeout: 45000 }).should('match', /\/admin\/(inicio|clientes)/);
  cy.get('body').then($body => {
    if ($body.find('.swal2-popup:visible').length) {
      const msg = $body.find('.swal2-html-container').text().trim();
      throw new Error(`Login no completado: ${msg || 'error desconocido'}`);
    }
  });
  cy.get('mat-sidenav', { timeout: 20000 }).should('exist');
});

Cypress.Commands.add('navigateAdmin', (path: string) => {
  cy.get(`a[routerLink="${path}"]`, { timeout: 15000 }).should('be.visible').click();
  cy.url({ timeout: 15000 }).should('include', path);
});

Cypress.Commands.add('confirmSwal', () => {
  cy.get('body').then($body => {
    if ($body.find('.swal2-popup:visible').length) {
      cy.get('.swal2-confirm:visible').click({ force: true });
    }
  });
});

Cypress.Commands.add('dismissSwalSuccess', () => {
  cy.get('.swal2-popup', { timeout: 30000 }).should('exist');
  cy.get('.global-loading-overlay', { timeout: 30000 }).should('not.exist');
  cy.get('.swal2-confirm').click({ force: true });
  cy.get('.swal2-popup').should('not.exist');
});

Cypress.Commands.add('fillClienteFormBasico', (options) => {
  cy.get('mat-dialog-container').should('be.visible');
  cy.get('input[formControlName="nombre"]').clear().type(options.nombre);
  cy.get('input[formControlName="apellidoPaterno"]').clear().type(options.apellidoPaterno);
  cy.get('mat-select[formControlName="genero"]').click();
  cy.get('mat-option').contains('Masculino').click();
  cy.get('input[formControlName="telefono"]').clear().type(options.telefono);
  if (options.correo) {
    cy.get('input[formControlName="correo"]').clear().type(options.correo);
  }
});

export {};
