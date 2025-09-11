describe('Paciente - Vacunas flujos', () => {
  const url = '/admin/paciente';
  const today = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`; // dd/MM/yyyy
  })();

  beforeEach(() => {
    cy.visit(url);
    cy.contains('Vacunas').click();
  });

  it('abre diálogo para nueva vacuna y cierra', () => {
    cy.contains('Nueva Vacuna').click({ force: true });
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('Cancelar').click({ force: true });
  });

  it('crea y elimina una vacuna temporal validando conteo del paciente', () => {
    let count0 = 0;
    cy.get('body').then(($b) => {
      const items = $b.find('.vacunas-lista .vacuna-item, .mat-table .mat-row');
      count0 = items.length;
    });

    cy.contains('Nueva Vacuna').click({ force: true });
    cy.get('mat-dialog-container').should('be.visible');

    // Fecha
    cy.get('input[formcontrolname="fecha"]', { timeout: 2000 })
      .clear({ force: true })
      .type(today, { force: true });

    // Tipo de vacuna
    cy.get('mat-select[formcontrolname="tipo"]').click({ force: true });
    cy.get('mat-option').first().click({ force: true });

    // Doctor (opcional)
    cy.get('body').then(($b) => {
      if ($b.find('mat-select[formcontrolname="doctor"]').length) {
        cy.get('mat-select[formcontrolname="doctor"]').click({ force: true });
        cy.get('mat-option').first().click({ force: true });
      }
    });

    // Guardar
    cy.contains(/guardar|crear/i).click({ force: true });

    // Validación de +1
    cy.get('.vacunas-lista .vacuna-item, .mat-table .mat-row')
      .its('length')
      .should('eq', count0 + 1);

    // Eliminar la vacuna creada (primer item)
    cy.get('body').then(($b) => {
      const delBtn = $b.find('button[mattooltip="Eliminar"]').first();
      if (delBtn.length) cy.wrap(delBtn).click({ force: true });
    });

    cy.get('body').then(($b) => {
      if ($b.find('.swal2-confirm').length) {
        cy.get('.swal2-confirm').click({ force: true });
      }
    });

    // Validación de retorno
    cy.get('.vacunas-lista .vacuna-item, .mat-table .mat-row')
      .its('length')
      .should('eq', count0);
  });
});


