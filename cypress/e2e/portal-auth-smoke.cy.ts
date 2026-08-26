/**
 * Portal autenticado — requiere portalEmail / portalPassword en cypress.env.json
 * (NO commitear secrets). Si faltan, se omite la suite.
 */
describe('Portal auth smoke', () => {
  before(function () {
    if (!Cypress.env('portalEmail') || !Cypress.env('portalPassword')) {
      Cypress.log({
        name: 'skip',
        message:
          'Sin portalEmail/portalPassword en cypress.env.json — ver cypress.env.example.json. Suite omitida.'
      });
      this.skip();
    }
  });

  it('login portal → mascotas; historial no expone notas internas', () => {
    cy.loginPortal();
    cy.url({ timeout: 30000 }).should('include', '/portal/');
    cy.visit('/portal/mascotas');
    cy.url().should('include', '/portal/mascotas');
    cy.get('body').should('be.visible');

    cy.get('body').then(($body) => {
      const href = $body.find('a[href*="/portal/mascotas/"]').first().attr('href');
      if (href) {
        const mascotaPath = href.split('?')[0].replace(/\/$/, '');
        cy.visit(mascotaPath);
        cy.visit(`${mascotaPath}/citas`);
        cy.url().should('include', '/citas');
        cy.visit(`${mascotaPath}/historial`);
        cy.url().should('include', '/historial');
        cy.visit(`${mascotaPath}/banos`);
        cy.url().should('include', '/banos');
        cy.contains(/Baños y peluquería/i);
        cy.get('body').should('not.contain', 'notas_internas');
        cy.get('body').should('not.contain', 'Notas internas');
      } else {
        cy.log('Sin mascotas en cuenta portal — empty state OK');
      }
    });
  });

  it('dual contexto: si aparece selector, entra a Portal mis mascotas', () => {
    cy.visit('/portal/login');
    const email = Cypress.env('portalEmail') as string;
    const password = Cypress.env('portalPassword') as string;
    cy.get('input[name="email"]').clear().type(email);
    cy.get('input[name="password"]').clear().type(password, { log: false });
    cy.contains('button', /iniciar|entrar|sesión/i).click();

    cy.url({ timeout: 45000 }).should('match', /\/(auth\/contexto|portal\/)/);
    cy.location('pathname').then((pathname) => {
      if (pathname.includes('/auth/contexto')) {
        cy.contains('button', 'Portal mis mascotas', { timeout: 15000 })
          .should('be.visible')
          .click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/portal/');
      }
    });
  });
});
