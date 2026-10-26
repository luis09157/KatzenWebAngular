// Smoke test de /admin/paciente (expediente con paciente seleccionado)

describe('Paciente - Smoke', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      cy.log('Omitido: configura cypress.env.json');
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.openPacienteExpediente();
  });

  it('navega entre tabs sin errores', () => {
    cy.contains('[role="tab"]', 'Historial').click();
    cy.contains('[role="tab"]', 'Recordatorios').click();
    cy.contains('[role="tab"]', 'Vacunas').click();
    cy.contains('[role="tab"]', 'Baños').click();
    cy.get('.clinical-list, app-admin-empty-state').should('exist');
  });

  it('estado vacío en Baños remite a «+ Agregar» o muestra lista', () => {
    cy.contains('[role="tab"]', 'Baños').click();
    cy.get('body').then(($body) => {
      if ($body.text().includes('Aún no hay baños')) {
        cy.contains('Usa «+ Agregar»').should('be.visible');
      } else {
        cy.get('.clinical-list__item').should('have.length.at.least', 1);
      }
    });
  });
});
