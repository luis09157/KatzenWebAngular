describe('Paciente - Historial smoke', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.openPacienteExpediente();
    cy.contains('[role="tab"]', 'Historial').click();
  });

  it('abre diálogo de nuevo historial y lo cierra', () => {
    cy.contains('button', /Nuevo historial/i).click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('button', /Cancelar/i).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('muestra lista clínica o estado vacío', () => {
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
  });
});
