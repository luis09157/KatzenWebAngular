describe('Admin login E2E', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: crea cypress.env.json desde cypress.env.example.json');
      this.skip();
    }
  });

  it('inicia sesión staff y llega al dashboard', () => {
    cy.loginAdmin();
    cy.visit('/admin/inicio');
    cy.url().should('include', '/admin/inicio');
    cy.get('mat-sidenav').should('exist');
  });

  it('redirige rutas protegidas tras login', () => {
    cy.loginAdmin();
    cy.visit('/admin/clientes');
    cy.url().should('include', '/admin/clientes');
    cy.contains('Administración de Clientes', { timeout: 20000 });
  });
});
