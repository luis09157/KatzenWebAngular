/**
 * Portal: alta con correo auto-provisiona; revoke; cleanup.
 * Login portal no se prueba (sin password / Resend KEY ausente).
 */
describe('Admin portal — provision / flags / revoke', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('alta con correo activa portal; revoca y limpia cliente efímero', () => {
    const runId = Date.now();
    const nombre = `E2EPort${runId}`;
    const apellido = 'PortalAuto';
    const telefono = String(8104000000 + (runId % 999999)).slice(0, 10);
    const correo = `e2e.portal.${runId}@example.com`;

    cy.loginAdmin();
    cy.navigateAdmin('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('button', /Nuevo cliente/i).click();
    cy.fillClienteFormBasico({ nombre, apellidoPaterno: apellido, telefono, correo });
    cy.get('mat-dialog-actions button').contains('Guardar').click();

    cy.get('.swal2-popup', { timeout: 60000 }).should('be.visible');
    cy.get('.swal2-title, .swal2-html-container').should(($el) => {
      expect(($el.text() || '').toLowerCase()).to.match(/cliente|portal/);
    });
    cy.dismissSwalSuccess();

    cy.navigateAdmin('/admin/usuarios');
    cy.get('.loading-container', { timeout: 45000 }).should('not.exist');
    cy.contains('.mat-mdc-tab, .mdc-tab', /Clientes con portal/i).click();
    cy.get('input[aria-label="Buscar cliente con portal"]', { timeout: 15000 })
      .clear({ force: true })
      .type(correo, { force: true });
    cy.contains('tr', correo, { timeout: 25000 }).should('be.visible');

    cy.contains('tr', correo).within(() => {
      cy.get('button[matTooltip="Desactivar portal"]').click({ force: true });
    });
    cy.get('.swal2-confirm').contains(/Sí, desactivar/i).click();
    cy.dismissSwalSuccess();
    cy.get('input[aria-label="Buscar cliente con portal"]').clear({ force: true }).type(correo, { force: true });
    cy.contains('tr', correo).should('not.exist');

    // Cleanup best-effort (listado clientes pagina RTDB; el alta reciente puede no estar en página 1)
    cy.navigateAdmin('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.buscador input').clear({ force: true }).type(nombre, { force: true });
    cy.get('body').then($body => {
      if ($body.text().includes(nombre)) {
        cy.contains('tr', nombre).within(() => {
          cy.get('button[matTooltip="Borrar"]').click();
        });
        cy.get('.swal2-confirm').contains('Sí, borrar').click();
        cy.get('.swal2-popup', { timeout: 45000 }).should('be.visible');
        cy.dismissSwalSuccess();
      } else {
        cy.log(`Cleanup: cliente ${nombre} no visible en página cargada (portal ya revocado)`);
      }
    });
  });
});
