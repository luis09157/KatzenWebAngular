describe('Admin smoke', () => {
  it('carga la landing pública', () => {
    cy.visit('/');
    cy.contains('Katzen', { matchCase: false });
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
