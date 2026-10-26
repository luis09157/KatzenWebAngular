/**
 * Pacientes: una sola entrada en el menú lateral (2026-10-26, spec 096 F4).
 * Abre el directorio; dentro del expediente sigue marcada y «Volver a Pacientes» regresa al directorio.
 */
describe('Admin sidenav — Pacientes una sola entrada', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.navigateAdmin('/admin/inicio');
  });

  it('el menú tiene una sola entrada «Pacientes» y ya no existe «Buscar paciente»', () => {
    cy.get('.admin-sidenav a', { timeout: 15000 }).filter(':contains("Pacientes")').should('have.length', 1);
    cy.get('.admin-sidenav').contains('a', 'Buscar paciente').should('not.exist');
    cy.get('.admin-sidenav a[href="/admin/paciente"]').should('not.exist');
  });

  it('«Pacientes» abre el directorio y queda marcado en el expediente', () => {
    cy.get('.admin-sidenav a[href="/admin/pacientes-admin"]').first().click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/admin/pacientes-admin');
    cy.get('.admin-sidenav a[href="/admin/pacientes-admin"].active').should('exist');

    cy.visitAdminModule('/admin/paciente');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.admin-sidenav a[href="/admin/pacientes-admin"].active').should('exist');
  });
});
