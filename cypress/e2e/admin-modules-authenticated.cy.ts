/** Smoke autenticado: módulos admin cargan UI principal sin error fatal. */
describe('Admin modules authenticated', () => {
  beforeEach(() => {
    cy.loginAdmin();
  });

  const modules: Array<{ path: string; container: string; title: string }> = [
    { path: '/admin/citas', container: '.citas-contenedor', title: 'Administración de Citas' },
    { path: '/admin/historiales', container: '.historiales-contenedor', title: 'Administración de Historiales Clínicos' },
    { path: '/admin/vacunas', container: '.vacunas-contenedor', title: 'Administración de Vacunas' },
    { path: '/admin/recordatorios', container: '.recordatorios-contenedor', title: 'Administración de Recordatorios' },
    { path: '/admin/usuarios', container: '.usuarios-contenedor', title: 'Administración de Usuarios' },
    { path: '/admin/pacientes-admin', container: '.pacientes-contenedor', title: 'Administración de Pacientes' },
    { path: '/admin/contactos-web', container: '.contactos-contenedor', title: 'Administración de Contactos Web' },
    { path: '/admin/inventario/productos', container: '.admin-page', title: 'Catálogo de Productos' },
    { path: '/admin/inventario/proveedores', container: '.admin-page', title: 'Proveedores' },
    { path: '/admin/inventario/ordenes', container: '.admin-page', title: 'Órdenes de compra' },
    { path: '/admin/inventario/movimientos', container: '.admin-page', title: 'Historial de movimientos' },
    { path: '/admin/inventario/alertas', container: '.alertas-container', title: 'Centro de Alertas' }
  ];

  modules.forEach(({ path, container, title }) => {
    it(`carga ${path} con sesión admin`, () => {
      cy.visitAdminModule(path);
      cy.url({ timeout: 15000 }).should('include', path);
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.get(container, { timeout: 20000 }).should('exist');
      cy.contains(title, { matchCase: false });
    });
  });

  it('abre diálogo de nueva cita y cierra', () => {
    cy.navigateAdmin('/admin/citas');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('button', 'Nueva cita').click();
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container').contains('Nueva cita');
    cy.get('mat-dialog-container button').contains('Cerrar').click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });

  it('abre flujo de nuevo recordatorio global y cancela selección de cliente', () => {
    cy.navigateAdmin('/admin/recordatorios');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
    cy.contains('button', 'Nuevo recordatorio').click({ force: true });
    cy.get('mat-dialog-container', { timeout: 15000 }).should('be.visible');
    cy.get('mat-dialog-container button').contains('Cancelar').click({ force: true });
    cy.get('mat-dialog-container').should('not.exist');
  });
});
