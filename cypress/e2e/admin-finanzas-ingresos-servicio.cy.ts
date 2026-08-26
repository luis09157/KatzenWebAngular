/** Finanzas — tab Ingresos por servicio (spec 028). */
describe('Admin — Finanzas ingresos por servicio', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('muestra tab Ingresos por servicio con panel o empty state', () => {
    cy.loginAdmin();
    cy.navigateAdmin('/admin/finanzas');
    cy.get('.finanzas-contenedor', { timeout: 20000 }).should('exist');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');

    cy.contains('.mat-mdc-tab, .mdc-tab', /Ingresos por servicio/i).click({ force: true });
    cy.contains(/Ingresos por servicio|Sin ingresos|categoría/i, { timeout: 15000 });
  });
});
