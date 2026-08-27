/** Portal pensión + recordatorios read-only (spec 031). */
describe('Portal pensión/recordatorios — smoke', () => {
  it('guest: login portal accesible', () => {
    cy.visit('/portal/login');
    cy.url().should('include', '/portal/login');
    cy.contains(/portal|dueño|mascota/i);
  });

  it('auth: pensión y recordatorios read-only (skip sin credenciales)', function () {
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
      cy.visit(`${path}/pension`);
      cy.url().should('include', '/pension');
      cy.contains(/Pensión|estancia/i);
      cy.get('button').contains(/editar|eliminar|borrar|cobrar/i).should('not.exist');

      cy.visit(`${path}/recordatorios`);
      cy.url().should('include', '/recordatorios');
      cy.contains(/Recordatorio/i);
      cy.get('button').contains(/editar|eliminar|borrar/i).should('not.exist');
    });
  });
});
