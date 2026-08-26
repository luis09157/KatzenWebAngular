/**
 * Dual /auth/contexto: tras login, si la cuenta es dual muestra selector centrado;
 * si no, permanece en admin (comportamiento válido para staff puro).
 */
describe('Auth dual / contexto', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('login llega a admin o selector dual usable', () => {
    cy.loginAdmin();
    cy.url().should('match', /\/admin\//);
    cy.get('mat-sidenav').should('exist');

    // Intento explícito de abrir contexto (solo útil si claims dual)
    cy.visit('/auth/contexto', { failOnStatusCode: false });
    cy.url({ timeout: 20000 }).then(url => {
      if (url.includes('/auth/contexto')) {
        cy.contains('¿A dónde quieres entrar?', { timeout: 15000 }).should('be.visible');
        cy.contains('button', 'Panel admin').should('be.visible');
        cy.contains('button', 'Portal mis mascotas').should('be.visible');
        cy.get('.admin-auth-page.contexto-page').should('be.visible');
        cy.get('.admin-auth-card').should('be.visible');
        cy.contains('button', 'Panel admin').click({ force: true });
        cy.url({ timeout: 20000 }).should('include', '/admin/');
      } else {
        // Staff sin dual: redirige fuera de contexto — OK
        cy.url().should('match', /\/(admin|portal)\//);
      }
    });
  });
});
