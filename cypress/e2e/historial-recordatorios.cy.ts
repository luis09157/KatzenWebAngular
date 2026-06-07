describe('Paciente - Historial y Recordatorios smoke', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.openPacienteExpediente();
  });

  it('abre tab Historial sin errores', () => {
    cy.contains('[role="tab"]', 'Historial').click();
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
  });

  it('abre tab Recordatorios y diálogo nuevo', () => {
    cy.contains('[role="tab"]', 'Recordatorios').click();
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
    cy.contains('button', /Nuevo recordatorio/i).click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('button', /Cancelar/i).click({ force: true });
  });
});
