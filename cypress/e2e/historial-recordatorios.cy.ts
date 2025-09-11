describe('Paciente - Historial y Recordatorios', () => {
  const url = '/admin/paciente';

  beforeEach(() => {
    cy.visit(url);
  });

  it('crea y elimina un historial temporal validando conteo del paciente', () => {
    cy.contains('Historial').click();

    let count0 = 0;
    cy.get('body').then(($b) => {
      const items = $b.find('.historial-lista .historial-item, .mat-table .mat-row');
      count0 = items.length;
    });

    cy.contains('Nuevo Historial').click({ force: true });
    cy.get('mat-dialog-container').then(($d) => {
      if ($d.length) {
        cy.get('input, textarea').first().type('Test historial', { force: true });
        cy.contains(/guardar|crear/i).click({ force: true });

        cy.get('.historial-lista .historial-item, .mat-table .mat-row')
          .its('length')
          .should('eq', count0 + 1);

        // Eliminar el primer historial
        cy.get('body').then(($b2) => {
          const delBtn = $b2.find('button[mattooltip="Eliminar"]').first();
          if (delBtn.length) cy.wrap(delBtn).click({ force: true });
        });
        cy.get('body').then(($b3) => {
          if ($b3.find('.swal2-confirm').length) cy.get('.swal2-confirm').click({ force: true });
        });

        cy.get('.historial-lista .historial-item, .mat-table .mat-row')
          .its('length')
          .should('eq', count0);
      }
    });
  });

  it('crea, cambia estado (si aplica) y elimina un recordatorio temporal validando conteo', () => {
    cy.contains('Recordatorios').click();

    let count0 = 0;
    cy.get('body').then(($b) => {
      const items = $b.find('.recordatorios-lista .recordatorio-item, .mat-table .mat-row');
      count0 = items.length;
    });

    cy.contains(/nuevo recordatorio|agregar/i).click({ force: true });
    cy.get('mat-dialog-container').then(($d) => {
      if ($d.length) {
        // Completar campos básicos
        cy.get('input, textarea').first().type('Recordatorio prueba', { force: true });
        cy.contains(/guardar|crear/i).click({ force: true });

        cy.get('.recordatorios-lista .recordatorio-item, .mat-table .mat-row')
          .its('length')
          .should('eq', count0 + 1);

        // Si existe toggle/cambio de estado, intenta accionarlo
        cy.get('body').then(($b2) => {
          const toggle = $b2.find('button[mattooltip*="complet"]; input[type="checkbox"]').first();
          if (toggle.length) cy.wrap(toggle).click({ force: true });
        });

        // Eliminar el recordatorio
        cy.get('body').then(($b3) => {
          const delBtn = $b3.find('button[mattooltip="Eliminar"]').first();
          if (delBtn.length) cy.wrap(delBtn).click({ force: true });
        });
        cy.get('body').then(($b4) => {
          if ($b4.find('.swal2-confirm').length) cy.get('.swal2-confirm').click({ force: true });
        });

        cy.get('.recordatorios-lista .recordatorio-item, .mat-table .mat-row')
          .its('length')
          .should('eq', count0);
      }
    });
  });
});


