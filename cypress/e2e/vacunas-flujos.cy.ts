describe('Paciente - Vacunas flujos', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: configura cypress.env.json');
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.openPacienteExpediente();
    cy.contains('[role="tab"]', 'Vacunas').click();
  });

  it('abre diálogo para nueva vacuna y cierra', () => {
    cy.contains('button', /Nueva vacuna/i).click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('button', /Cancelar/i).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('muestra lista clínica o estado vacío en vacunas', () => {
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
  });
});
