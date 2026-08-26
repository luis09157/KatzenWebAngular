/**
 * Pacientes admin: smoke CRUD útil.
 * Create se verifica por Swal; listado pagina RTDB (limitToLast) y el filtro es solo local —
 * por eso no dependemos de encontrar la fila si la página no la incluye.
 * Si aparece en la primera página, completa edit + borrar; si no, deja constancia y limpia dueño.
 */
describe('Admin CRUD — Pacientes', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  it('crea paciente (Swal) y completa edit/borrar si aparece en listado', () => {
    const runId = Date.now();
    const dueñoNombre = `E2EDue${runId}`;
    const dueñoApellido = 'PacienteAuto';
    const telefono = String(8103000000 + (runId % 999999)).slice(0, 10);
    const correo = `e2e.pac.${runId}@example.com`;
    const mascota = `E2EPet${runId}`;
    const mascotaEdit = `${mascota}X`;

    cy.loginAdmin();

    cy.navigateAdmin('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('button', /Nuevo cliente/i).click();
    cy.fillClienteFormBasico({
      nombre: dueñoNombre,
      apellidoPaterno: dueñoApellido,
      telefono,
      correo
    });
    cy.get('mat-dialog-actions button').contains('Guardar').click();
    cy.dismissSwalSuccess();

    cy.navigateAdmin('/admin/pacientes-admin');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('button', /Nuevo paciente/i).click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('input[formControlName="nombre"]').click({ force: true }).clear({ force: true }).type(mascota, { force: true });
    cy.get('mat-select[formControlName="especie"]').click({ force: true });
    cy.get('mat-option').contains('CANINO').click({ force: true });
    cy.get('input[formControlName="raza"]').click({ force: true }).clear({ force: true }).type('Mestizo', { force: true });
    cy.get('input[formControlName="color"]').click({ force: true }).clear({ force: true }).type('Cafe', { force: true });
    cy.get('mat-select[formControlName="sexo"]').click({ force: true });
    cy.get('mat-option').contains('Macho Entero').click({ force: true });
    cy.get('input[formControlName="peso"]').click({ force: true }).clear({ force: true }).type('5', { force: true });
    cy.get('input[formControlName="nombreCliente"]').click({ force: true }).clear({ force: true }).type(dueñoNombre, { force: true });
    cy.contains('mat-option', dueñoNombre, { timeout: 20000 }).click({ force: true });

    cy.contains('mat-dialog-actions button', /Crear paciente/i)
      .should('not.be.disabled')
      .click();

    cy.get('.swal2-html-container, .swal2-title', { timeout: 30000 }).should(($el) => {
      expect(($el.text() || '').toLowerCase()).to.include('paciente creado');
    });
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');

    cy.contains('strong', mascota, { timeout: 20000 }).should('be.visible');
    cy.contains('tr', mascota).within(() => {
      cy.get('button[matTooltip="Editar"]').click();
    });
    cy.get('input[formControlName="nombre"]').click({ force: true }).clear({ force: true }).type(mascotaEdit, { force: true });
    cy.contains('mat-dialog-actions button', /Guardar cambios/i).should('not.be.disabled').click();
    cy.get('.swal2-html-container, .swal2-title', { timeout: 20000 }).should(($el) => {
      expect(($el.text() || '').toLowerCase()).to.match(/actualizado|éxito/);
    });
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');
    cy.contains('strong', mascotaEdit, { timeout: 20000 }).should('be.visible');
    cy.contains('tr', mascotaEdit).within(() => {
      cy.get('button[matTooltip="Borrar"]').click();
    });
    cy.get('.swal2-confirm').contains('Sí, borrar').click();
    cy.dismissSwalSuccess();
    cy.contains('strong', mascotaEdit).should('not.exist');

    cy.navigateAdmin('/admin/clientes');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.get('.buscador input').clear({ force: true }).type(dueñoNombre, { force: true });
    cy.get('body').then($body => {
      if ($body.text().includes(dueñoNombre)) {
        cy.contains('tr', dueñoNombre).within(() => {
          cy.get('button[matTooltip="Borrar"]').click();
        });
        cy.get('.swal2-confirm').contains('Sí, borrar').click();
        cy.get('.swal2-popup', { timeout: 45000 }).should('be.visible');
        cy.dismissSwalSuccess();
      } else {
        cy.log(`Cleanup dueño ${dueñoNombre} no visible en página RTDB cargada`);
      }
    });
  });
});
