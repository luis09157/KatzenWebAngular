/**
 * Finanzas / caja — smoke autenticado (spec 014).
 * Create efímero + soft-delete opcional en el mismo spec.
 */
describe('Admin CRUD — Finanzas caja', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('smoke listado + registrar cobro → borrar', () => {
    const runId = Date.now();
    const concepto = `Cobro E2E ${runId}`;

    cy.loginAdmin();
    cy.navigateAdmin('/admin/finanzas');
    cy.url({ timeout: 15000 }).should('include', '/admin/finanzas');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.finanzas-contenedor', { timeout: 20000 }).should('exist');
    cy.contains('Caja / finanzas', { matchCase: false });
    // Si rules recién desplegadas o error de lectura previo, cierra Swal residual.
    cy.get('body').then(($b) => {
      if ($b.find('.swal2-confirm:visible').length) {
        cy.get('.swal2-confirm:visible').click({ force: true });
      }
    });
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');

    cy.contains('button', /Registrar cobro/i).click({ force: true });
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.contains('mat-dialog-container', 'Registrar movimiento');
    cy.fillMatInput('concepto', concepto);
    cy.fillMatInput('monto', '125.50');
    cy.get('mat-select[formControlName="metodoPago"]').click({ force: true });
    cy.get('.cdk-overlay-container mat-option').contains('Tarjeta').click({ force: true });
    cy.get('mat-checkbox[formControlName="ivaDeclarado"] input').check({ force: true });

    cy.get('[data-cy="caja-guardar"]').click({ force: true });
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Movimiento registrado');
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');

    cy.get('.buscador input').clear().type(concepto);
    cy.contains('td', concepto, { timeout: 20000 }).should('be.visible');
    cy.contains('td', 'Tarjeta').should('be.visible');
    cy.contains('td', 'Declarado').should('be.visible');

    cy.contains('tr', concepto).within(() => {
      cy.get('button[matTooltip="Borrar"]').click({ force: true });
    });
    cy.get('.swal2-confirm').contains('Sí, borrar').click({ force: true });
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Borrado');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');
    cy.get('.loading-container', { timeout: 15000 }).should('not.exist');
    cy.get('body').then(($b) => {
      if ($b.find('.buscador input:enabled').length) {
        cy.get('.buscador input:enabled').clear({ force: true }).type(concepto, { force: true });
      }
    });
    cy.contains('td', concepto).should('not.exist');
  });
});
