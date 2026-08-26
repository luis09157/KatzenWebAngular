/** Timepicker dialog en baños (spec 004). */
describe('Admin — timepicker baños', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('abre diálogo nuevo baño con app-timepicker-field', () => {
    cy.loginAdmin();
    cy.navigateAdmin('/admin/banios');
    cy.get('.banios-contenedor', { timeout: 20000 }).should('exist');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');

    cy.contains('button', /Nuevo baño/i).click({ force: true });
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container app-timepicker-field', { timeout: 10000 }).should('exist');
    cy.get('mat-dialog-container button.admin-dialog-close').click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });
});
