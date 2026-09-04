describe('Inventario productos — abrir detalle', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('clic, doble clic y el ojo abren el diálogo con stock y precios', () => {
    cy.loginAdmin();
    cy.visitAdminModule('/admin/inventario/productos');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('article.producto-card', { timeout: 20000 }).should('have.length.greaterThan', 0);

    cy.get('article.producto-card').first().click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('.admin-dialog-title').should('contain.text', 'Editar producto');
    cy.get('input[formControlName="precio_venta"]').scrollIntoView().should('exist');
    cy.get('input[formControlName="stock_minimo"]').scrollIntoView().should('exist');
    cy.get('button.admin-dialog-close').click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');

    cy.get('article.producto-card').eq(1).dblclick();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('.admin-dialog-title').should('contain.text', 'Editar producto');
    cy.get('input[formControlName="stock_minimo"]').scrollIntoView().should('exist');
    cy.get('button.admin-dialog-close').click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');

    cy.get('article.producto-card').first().within(() => {
      cy.get('button[matTooltip="Ver detalle"]').click();
    });
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('.admin-dialog-title').should('contain.text', 'Editar producto');
    cy.get('input[formControlName="precio_venta"]').scrollIntoView().should('exist');
  });
});
