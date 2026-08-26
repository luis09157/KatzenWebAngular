/**
 * Smoke autenticado — specs 009 (cascada UI) y 010 (notas_internas).
 * 008 (RTDB rules) no tiene UI; se valida aparte (JSON + deploy pendiente).
 * No borra clientes reales: cancela Swal; el borrado cascada E2E usa cliente efímero en cy:admin.
 */
describe('Admin features smoke 009/010', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: falta cypress.env.json');
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('010: /admin/historiales → Nuevo abre picker (flujo alcanzable)', () => {
    cy.navigateAdmin('/admin/historiales');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.historiales-contenedor', { timeout: 20000 }).should('exist');

    cy.contains('button', /Nuevo historial/i).click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container').contains(/Seleccionar cliente/i).should('be.visible');
    cy.get('mat-dialog-container button').contains(/Cancelar/i).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('010: expediente → Nuevo historial muestra notas_internas', () => {
    cy.openPacienteExpediente();
    cy.contains('[role="tab"]', 'Historial').click();
    cy.contains('button', /Nuevo historial/i).click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container textarea[formControlName="notas_internas"]')
      .scrollIntoView()
      .should('exist')
      .and('be.visible');
    cy.get('mat-dialog-container').contains(/Notas internas/i).should('exist');
    cy.contains('button', /Cancelar/i).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('009: Borrar cliente muestra confirmación de cascada (sin confirmar)', () => {
    cy.navigateAdmin('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.clientes-contenedor, .admin-page', { timeout: 20000 }).should('exist');

    cy.get('button[matTooltip="Borrar"]', { timeout: 20000 }).first().click({ force: true });
    cy.get('.swal2-popup', { timeout: 10000 }).should('be.visible');
    cy.get('.swal2-html-container, .swal2-content').should(($el) => {
      const text = ($el.text() || '').toLowerCase();
      expect(text).to.match(/mascota/);
      expect(text).to.match(/cita/);
      expect(text).to.match(/portal/);
    });
    cy.get('.swal2-cancel').contains(/Cancelar/i).click({ force: true });
    cy.get('.swal2-popup').should('not.exist');
  });
});
