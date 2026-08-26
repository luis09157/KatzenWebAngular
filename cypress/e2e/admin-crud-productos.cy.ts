/**
 * CRUD E2E Productos — datos efímeros + soft-delete (Borrar).
 * Swal de éxito usa timer (sin OK) — coherente con proveedores.
 */
describe('Admin CRUD — Productos', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('flujo completo: crear → editar → borrar', () => {
    const runId = Date.now();
    const codigo = `E2E${runId}`;
    const nombre = `Prod E2E ${runId}`;
    const nombreEdit = `${nombre} Edit`;

    cy.loginAdmin();
    cy.visitAdminModule('/admin/inventario/productos');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');

    cy.contains('button', /Nuevo producto/i).click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('input[formControlName="codigo_barras"]').click({ force: true }).clear({ force: true }).type(codigo, { force: true });
    cy.get('input[formControlName="nombre"]').click({ force: true }).clear({ force: true }).type(nombre, { force: true });
    cy.get('input[formControlName="marca"]').click({ force: true }).clear({ force: true }).type('MarcaE2E', { force: true });
    cy.get('input[formControlName="presentacion"]').click({ force: true }).clear({ force: true }).type('Caja E2E', { force: true });
    cy.get('input[formControlName="precio_compra"]').click({ force: true }).clear({ force: true }).type('10', { force: true });
    cy.get('input[formControlName="precio_venta"]').click({ force: true }).clear({ force: true }).type('20', { force: true });

    cy.get('mat-select[formControlName="proveedor_principal_id"]').click({ force: true });
    cy.get('.cdk-overlay-container mat-option', { timeout: 15000 }).first().click({ force: true });

    cy.get('mat-dialog-actions button.mat-mdc-raised-button')
      .should('not.be.disabled')
      .click({ force: true });

    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Éxito');
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');

    cy.get('.buscador input').clear().type(codigo);
    cy.contains('td', nombre, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', nombre).within(() => {
      cy.get('button[matTooltip="Editar"]').click();
    });
    cy.get('input[formControlName="nombre"]').click({ force: true }).clear({ force: true }).type(nombreEdit, { force: true });
    cy.get('mat-dialog-actions button.mat-mdc-raised-button')
      .should('not.be.disabled')
      .click({ force: true });
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Éxito');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');

    cy.get('.buscador input').clear().type(codigo);
    cy.contains('td', nombreEdit, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', nombreEdit).within(() => {
      cy.get('button[matTooltip="Borrar"]').click();
    });
    cy.get('.swal2-confirm').contains('Sí, borrar').click();
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Borrado');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');
    cy.get('.buscador input').clear().type(codigo);
    cy.contains('td', nombreEdit).should('not.exist');
  });
});
