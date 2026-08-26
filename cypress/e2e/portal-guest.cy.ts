/**
 * Portal guest — sin credenciales portal.
 * Flujos públicos: login UI, guards, redirect.
 */
describe('Portal guest', () => {
  it('carga /portal/login con formulario email/password', () => {
    cy.visit('/portal/login');
    cy.contains(/portal|dueño|mascotas/i).should('exist');
    cy.get('input[name="email"], input[type="email"]').should('be.visible');
    cy.get('input[name="password"], input[type="password"]').should('be.visible');
    cy.contains('button', /iniciar|entrar|sesión/i).should('exist');
  });

  it('ruta protegida /portal/mascotas redirige a login si no hay sesión', () => {
    cy.clearLocalStorage();
    cy.visit('/portal/mascotas', { failOnStatusCode: false });
    cy.url({ timeout: 20000 }).should('include', '/portal/login');
  });

  it('credenciales inválidas muestran error (sin secret)', () => {
    cy.visit('/portal/login');
    cy.get('input[name="email"]').should('be.visible').click({ force: true }).clear({ force: true }).type('no-existe-e2e@katzen.invalid', { force: true });
    cy.get('input[name="password"]').click({ force: true }).clear({ force: true }).type('wrong-password-e2e', { log: false, force: true });
    cy.contains('button', /iniciar|entrar|sesión/i).click({ force: true });
    cy.get('.swal2-popup', { timeout: 20000 }).should('be.visible');
  });
});
