// Flujos básicos de Baños desde el tab del expediente paciente

describe('Paciente - Baños flujos', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: configura cypress.env.json');
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.openPacienteExpediente();
    cy.contains('[role="tab"]', 'Baños').click();
  });

  it('abre diálogo de nuevo baño y valida campos básicos', () => {
    cy.contains('button', /Nuevo baño/i).click();
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('Programación');
    cy.contains('Servicio');
    cy.contains('button', /Cancelar/i).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('filtra por texto en buscar', () => {
    cy.get('.banios-tab__search input').type('baño', { force: true });
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
  });

  it('muestra lista clínica o estado vacío en baños', () => {
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
  });
});
