/**
 * CRUD E2E en Clientes (módulo de prueba).
 * Requiere: ng serve + cypress.env.json con adminEmail/adminPassword.
 */
describe('Admin CRUD — Clientes', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: copia cypress.env.example.json → cypress.env.json');
      this.skip();
    }
  });

  it('flujo completo: crear → editar → borrar', () => {
    const runId = Date.now();
    const nombre = `E2E${runId}`;
    const apellido = 'PruebaAuto';
    const telefonoInicial = String(8100000000 + (runId % 999999)).slice(0, 10);
    const telefonoEditado = String(8101000000 + (runId % 999999)).slice(0, 10);
    const correo = `e2e.${runId}@test.katzen.local`;
    cy.loginAdmin();
    cy.navigateAdmin('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');

    // CREATE
    cy.contains('button', /Nuevo cliente/i).click();
    cy.fillClienteFormBasico({
      nombre,
      apellidoPaterno: apellido,
      telefono: telefonoInicial,
      correo
    });
    cy.get('mat-dialog-actions button').contains('Guardar').click();
    cy.dismissSwalSuccess();
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.global-loading-overlay', { timeout: 30000 }).should('not.exist');

    cy.get('.buscador input').clear().type(telefonoInicial);
    cy.contains('td', nombre, { timeout: 20000 }).should('be.visible');

    // UPDATE
    cy.contains('tr', nombre).within(() => {
      cy.get('button[matTooltip="Editar"]').click();
    });
    cy.get('input[formControlName="telefono"]').clear().type(telefonoEditado);
    cy.get('mat-dialog-actions button').contains('Guardar').click();
    cy.dismissSwalSuccess();
    cy.get('.buscador input').clear().type(telefonoEditado);
    cy.contains('td', telefonoEditado, { timeout: 20000 }).should('be.visible');

    // DELETE (UI «Borrar»; soft-delete activo: false + copy cascada 009)
    cy.contains('tr', nombre).within(() => {
      cy.get('button[matTooltip="Borrar"]').click();
    });
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-html-container, .swal2-content').should(($el) => {
      const text = ($el.text() || '').toLowerCase();
      expect(text, 'confirmación debe mencionar cascada').to.match(/mascota/);
      expect(text).to.match(/cita/);
      expect(text).to.match(/portal/);
    });
    cy.get('.swal2-confirm').contains('Sí, borrar').click();
    cy.get('.swal2-popup', { timeout: 45000 }).should('exist');
    cy.get('.swal2-title, .swal2-html-container').should(($el) => {
      const text = ($el.text() || '').toLowerCase();
      expect(text).to.match(/borrad|cascada/);
    });
    cy.dismissSwalSuccess();
    cy.get('.buscador input').clear().type(telefonoEditado);
    cy.contains('td', nombre).should('not.exist');
  });
});
