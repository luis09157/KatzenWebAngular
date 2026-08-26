describe('Admin smoke', () => {
  it('carga la landing pública', () => {
    cy.visit('/');
    cy.contains('Katzen', { matchCase: false });
  });

  it('muestra registro de dueño en sección portal', () => {
    cy.visit('/');
    cy.contains('Crear cuenta', { matchCase: false }).should('be.visible');
    cy.contains('Crear cuenta', { matchCase: false }).first().click();
    cy.contains('Crear cuenta de dueño', { matchCase: false }).should('be.visible');
    cy.contains('aviso de privacidad', { matchCase: false }).should('exist');
  });

  it('carga la pantalla de login admin', () => {
    cy.visit('/admin/login');
    cy.get('input[type="email"], input[formcontrolname="email"]').should('exist');
  });

  it('carga la pantalla de login portal', () => {
    cy.visit('/portal/login');
    cy.contains('portal', { matchCase: false });
  });
});
