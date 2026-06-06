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

  it('flujo completo: crear → editar → baja lógica', () => {
    const runId = Date.now();
    const nombre = `E2E${runId}`;
    const apellido = 'PruebaAuto';
    const telefonoInicial = String(8100000000 + (runId % 999999)).slice(0, 10);
    const telefonoEditado = String(8101000000 + (runId % 999999)).slice(0, 10);
    const correo = `e2e.${runId}@test.katzen.local`;
    const etiquetaBusqueda = nombre.toLowerCase();

    cy.loginAdmin();
    cy.visit('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');

    // CREATE
    cy.contains('button', 'Nuevo Cliente').click();
    cy.fillClienteFormBasico({
      nombre,
      apellidoPaterno: apellido,
      telefono: telefonoInicial,
      correo
    });
    cy.get('mat-dialog-actions button').contains('Guardar').click();
    cy.dismissSwalSuccess();
    cy.get('mat-dialog-container').should('not.exist');

    cy.get('.buscador input').clear().type(etiquetaBusqueda);
    cy.contains('td', nombre, { timeout: 15000 }).should('be.visible');

    // UPDATE
    cy.contains('tr', nombre).within(() => {
      cy.get('button[matTooltip="Editar"]').click();
    });
    cy.get('input[formControlName="telefono"]').clear().type(telefonoEditado);
    cy.get('mat-dialog-actions button').contains('Guardar').click();
    cy.dismissSwalSuccess();
    cy.get('.buscador input').clear().type(etiquetaBusqueda);
    cy.contains('td', telefonoEditado, { timeout: 15000 }).should('be.visible');

    // DELETE (baja lógica)
    cy.contains('tr', nombre).within(() => {
      cy.get('button[matTooltip="Eliminar"]').click();
    });
    cy.get('.swal2-confirm').contains('Sí, dar de baja').click();
    cy.dismissSwalSuccess();
    cy.get('.buscador input').clear().type(etiquetaBusqueda);
    cy.contains('td', nombre).should('not.exist');
  });
});
