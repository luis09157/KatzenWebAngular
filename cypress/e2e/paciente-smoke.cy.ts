// Smoke test de /admin/paciente

describe('Paciente - Smoke', () => {
  const pacienteUrl = '/admin/paciente';

  beforeEach(() => {
    cy.visit(pacienteUrl);
  });

  it('navega entre tabs sin errores', () => {
    cy.contains('Historial').click();
    cy.contains('Recordatorios').click();
    cy.contains('Vacunas').click();
    cy.contains('Baños').click();
  });

  it('estado vacío en Baños muestra CTA', () => {
    cy.contains('Baños').click();
    cy.get('body').then(($body) => {
      if ($body.text().includes('No hay baños')) {
        cy.contains('Agregar primer baño').should('be.visible');
      }
    });
  });
});


