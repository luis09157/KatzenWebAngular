describe('Admin login E2E', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: crea cypress.env.json desde cypress.env.example.json');
      this.skip();
    }
  });

  it('inicia sesión staff y llega al dashboard', () => {
    cy.loginAdmin();
    cy.url().should('include', '/admin/inicio');
    cy.get('mat-sidenav').should('exist');
  });

  it('redirige rutas protegidas tras login', () => {
    cy.loginAdmin();
    cy.navigateAdmin('/admin/clientes');
    cy.contains('Administración de Clientes', { timeout: 20000 });
  });
});
