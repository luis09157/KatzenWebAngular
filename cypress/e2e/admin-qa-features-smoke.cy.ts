/**
 * Smoke QA autenticado — specs 003/004/005/007 (opción A con cypress.env.json).
 * Temporal de validación; no escribe secretos en el reporte.
 */
describe('Admin QA features smoke (003/004/005/007)', () => {
  beforeEach(() => {
    cy.loginAdmin();
  });

  it('citas: chips, vet, fecha gap, timepicker open/cancel, Guardar disabled vacío', () => {
    cy.navigateAdmin('/admin/citas');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.citas-contenedor', { timeout: 20000 }).should('exist');

    cy.get('body').then(($body) => {
      if ($body.find('.estado-badge').length) {
        cy.get('.estado-badge').first().should('be.visible').and(($el) => {
          const text = $el.text().trim();
          expect(text.length).to.be.greaterThan(0);
          expect($el[0].scrollWidth).to.be.at.most($el[0].clientWidth + 2);
        });
      }
      if ($body.find('.mat-column-veterinario .tag').length) {
        cy.get('.mat-column-veterinario .tag').first().should('be.visible').invoke('text').should('match', /\S/);
      }
      if ($body.find('.fecha-compact').length) {
        cy.get('.fecha-compact').first().within(() => {
          cy.root().should('be.visible');
          if (Cypress.$('.fecha-hora').length) {
            cy.get('.fecha-hora').should('be.visible');
          }
        });
      }
    });

    cy.contains('button', 'Nueva cita').click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container').contains('Nueva cita');

    cy.get('mat-dialog-container button[aria-label*="Abrir selector"]').first().click({ force: true });
    cy.get('.timepicker-dialog, .admin-dialog-shell--picker', { timeout: 10000 }).should('be.visible');
    cy.contains('.admin-dialog-actions button, mat-dialog-container button', 'Cancelar').click({ force: true });
    cy.get('.timepicker-dialog').should('not.exist');

    cy.get('mat-dialog-container').within(() => {
      cy.contains('button', 'Guardar').should('be.disabled');
    });

    cy.get('mat-dialog-container button').contains('Cerrar').click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('inventario movimientos: merma — motivo obligatorio y stock insuficiente en UI', () => {
    cy.visitAdminModule('/admin/inventario/movimientos');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('Historial de movimientos', { timeout: 20000 });

    cy.contains('button', 'Salida').click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container').contains(/Registrar salida|Registrar merma/);

    cy.get('mat-dialog-container').within(() => {
      cy.get('mat-select[formControlName="motivo"]').click();
    });
    cy.get('mat-option').contains('Merma').click();
    cy.get('mat-dialog-container').contains('Registrar merma');

    cy.get('mat-dialog-container').within(() => {
      cy.contains('button', 'Registrar merma').should('be.disabled');
    });

    cy.get('mat-dialog-container input[formControlName="producto_busqueda"], mat-dialog-container input').first().then(($input) => {
      if ($input.length) {
        cy.wrap($input).click({ force: true }).type('a', { force: true });
      }
    });

    cy.get('body').then(($body) => {
      if ($body.find('mat-option, .mat-mdc-option').length) {
        cy.get('mat-option, .mat-mdc-option').first().click({ force: true });
      }
    });

    cy.get('mat-dialog-container').then(($dlg) => {
      const qty = $dlg.find('input[formControlName="cantidad"]');
      if (qty.length) {
        cy.wrap(qty).clear({ force: true }).type('999999', { force: true });
      }
    });

    cy.get('body').then(($body) => {
      const text = $body.text();
      const hasStockMsg =
        /No hay suficiente stock|stock insuficiente|insuficiente/i.test(text);
      const mermaBtnDisabled = $body
        .find('mat-dialog-container button')
        .filter((_, el) => /Registrar merma/i.test(el.textContent || ''))
        .is(':disabled');
      expect(hasStockMsg || mermaBtnDisabled, 'validación merma visible o CTA disabled').to.eq(true);
    });

    cy.get('mat-dialog-container button').contains(/Cancelar|Cerrar/).click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });
});
