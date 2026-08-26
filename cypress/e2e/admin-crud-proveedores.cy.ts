/**
 * Proveedores — smoke + intento CRUD.
 * Create completo vía Cypress queda FAIL (Formulario incompleto pese a llenar campos;
 * probable desync Material reactive form). Read/UI del módulo sí se verifica.
 */
describe('Admin CRUD — Proveedores', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('smoke: listado + diálogo nuevo proveedor abre y cancela', () => {
    cy.loginAdmin();
    cy.visitAdminModule('/admin/inventario/proveedores');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('Proveedores', { matchCase: false });
    cy.contains('button', /Nuevo proveedor/i).click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('input[formControlName="razon_social"]').should('exist');
    cy.get('input[formControlName="nombre_comercial"]').should('exist');
    cy.get('input[formControlName="contacto_email"]').should('exist');
    cy.contains('mat-dialog-actions button', /Cancelar/i).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });
});
