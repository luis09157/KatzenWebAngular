/** Portal baños read-only — guest puede ver login; auth requiere credenciales (spec 028). */
describe('Portal baños — smoke', () => {
  it('guest: login portal accesible', () => {
    cy.visit('/portal/login');
    cy.url().should('include', '/portal/login');
    cy.contains(/portal|dueño|mascota/i);
  });

  it('auth: baños read-only en mascota (skip sin credenciales)', function () {
    if (!Cypress.env('portalEmail') || !Cypress.env('portalPassword')) {
      cy.log('Sin portalEmail/portalPassword — ver cypress.env.example.json');
      this.skip();
    }
    cy.loginPortal();
    cy.visit('/portal/mascotas');
    cy.get('body').then(($body) => {
      const href = $body.find('a[href*="/portal/mascotas/"]').first().attr('href');
      if (!href) {
        cy.log('Sin mascotas — empty state OK');
        return;
      }
      const path = href.split('?')[0].replace(/\/$/, '');
      cy.visit(`${path}/banos`);
      cy.url().should('include', '/banos');
      cy.contains(/Baños y peluquería|baño|peluquería/i);
      cy.get('button').contains(/editar|eliminar|borrar/i).should('not.exist');
    });
  });
});
