/**
 * Inventario: una sola entrada en el menú lateral (spec 096 F4, reemplaza 027).
 * Las secciones se abren desde las tarjetas de la pantalla de Inventario.
 */
describe('Admin sidenav — Inventario una sola entrada', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  const secciones: Array<{ card: string; path: string; title: string; container: string }> = [
    { card: 'Productos', path: '/admin/inventario/productos', title: 'Catálogo de Productos', container: '.admin-page' },
    { card: 'Movimientos', path: '/admin/inventario/movimientos', title: 'Historial de movimientos', container: '.admin-page' },
    { card: 'Proveedores', path: '/admin/inventario/proveedores', title: 'Proveedores', container: '.admin-page' },
    { card: 'Órdenes de compra', path: '/admin/inventario/ordenes', title: 'Órdenes de compra', container: '.admin-page' },
    { card: 'Alertas', path: '/admin/inventario/alertas', title: 'Alertas de inventario', container: '.alertas-contenedor' },
    { card: 'Reportes', path: '/admin/inventario/reportes', title: 'Reportes e informes', container: '.reportes-contenedor' },
  ];

  beforeEach(() => {
    cy.loginAdmin();
    cy.navigateAdmin('/admin/inventario');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
  });

  it('el menú lateral tiene una sola entrada de Inventario', () => {
    cy.get('.admin-sidenav a[href*="/admin/inventario"]', { timeout: 15000 }).should('have.length', 1);
    cy.get('.admin-sidenav').contains('a', 'Inventario').should('exist');
  });

  secciones.forEach(({ card, path, title, container }) => {
    it(`abre ${card} desde la pantalla de Inventario`, () => {
      cy.visitAdminModule(path);
      cy.url({ timeout: 15000 }).should('include', path);
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.get(container, { timeout: 20000 }).should('exist');
      cy.contains(title, { matchCase: false });
      // Inventario sigue marcado en el menú dentro de las secciones
      cy.get('.admin-sidenav a[href*="/admin/inventario"].active').should('exist');
    });
  });
});
