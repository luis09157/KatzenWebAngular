describe('Admin smoke', () => {
  it('carga la landing pública', () => {
    cy.visit('/');
    cy.contains('Katzen', { matchCase: false });
  });

  it('muestra registro de dueño en sección portal', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Evita IntersectionObserver/reveal que deja opacity:0 en headless.
        win.matchMedia = ((query: string) =>
          ({
            matches: String(query).includes('prefers-reduced-motion'),
            media: query,
            onchange: null,
            addListener: () => undefined,
            removeListener: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            dispatchEvent: () => false
          })) as typeof win.matchMedia;
      }
    });
    cy.get('#portal-duenos').scrollIntoView();
    cy.contains('button', 'Crear cuenta').should('be.visible').click();
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
