/**
 * Proveedores — CRUD efímero (Create → Edit → soft-delete Borrar).
 * fillMatInput + sync DOM→FormControl (solo si DOM tiene valor) evitan «Formulario incompleto».
 */
describe('Admin CRUD — Proveedores', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  function fillProveedorRequired(opts: {
    razon: string;
    comercial: string;
    email: string;
    telefono?: string;
    contacto?: string;
  }): void {
    cy.fillMatInput('razon_social', opts.razon);
    cy.fillMatInput('nombre_comercial', opts.comercial);
    cy.fillMatInput('contacto_nombre', opts.contacto || 'Contacto E2E');
    cy.fillMatInput('contacto_telefono', opts.telefono || '5512345678');
    cy.fillMatInput('contacto_email', opts.email);
  }

  it('flujo completo: crear → editar → borrar', () => {
    const runId = Date.now();
    const razon = `Raz Soc E2E ${runId}`;
    const comercial = `Prov E2E ${runId}`;
    const comercialEdit = `${comercial} Edit`;
    const email = `prov.e2e.${runId}@katzenvet.test`;

    cy.loginAdmin();
    cy.visitAdminModule('/admin/inventario/proveedores');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('Proveedores', { matchCase: false });

    cy.contains('button', /Nuevo proveedor/i).click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    fillProveedorRequired({ razon, comercial, email });

    cy.get('[data-cy="proveedor-guardar"]').should('not.be.disabled').click({ force: true });
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Proveedor creado');
    cy.get('mat-dialog-container').should('not.exist');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');

    cy.get('.buscador input').first().clear().type(comercial);
    cy.contains('td', comercial, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', comercial).within(() => {
      cy.get('button[matTooltip="Editar"]').click({ force: true });
    });
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    // Re-llenar required en edit (Material a veces no hidrata FormControl a tiempo).
    fillProveedorRequired({ razon, comercial: comercialEdit, email });
    cy.get('[data-cy="proveedor-guardar"]').should('not.be.disabled').click({ force: true });
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Proveedor actualizado');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');

    cy.get('.buscador input').first().clear().type(comercialEdit);
    cy.contains('td', comercialEdit, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', comercialEdit).within(() => {
      cy.get('button[matTooltip="Borrar"]').click({ force: true });
    });
    cy.get('.swal2-confirm').contains('Sí, borrar').click({ force: true });
    cy.get('.swal2-title', { timeout: 20000 }).should('contain.text', 'Borrado');
    cy.get('body', { timeout: 10000 }).should('not.have.class', 'swal2-shown');
    cy.get('.buscador input').first().clear().type(comercialEdit);
    cy.contains('td', comercialEdit).should('not.exist');
  });
});
