/** Smoke sidenav: sub-ítems de Inventario visibles y navegables (spec 027). */
describe('Admin sidenav — Inventario sub-ítems', () => {
  before(function () {
    if (!Cypress.env('adminEmail') || !Cypress.env('adminPassword')) {
      this.skip();
    }
  });

  const subItems: Array<{ label: string; path: string; title: string; container: string }> = [
    { label: 'Productos', path: '/admin/inventario/productos', title: 'Catálogo de Productos', container: '.admin-page' },
    { label: 'Movimientos', path: '/admin/inventario/movimientos', title: 'Historial de movimientos', container: '.admin-page' },
    { label: 'Proveedores', path: '/admin/inventario/proveedores', title: 'Proveedores', container: '.admin-page' },
    { label: 'Órdenes de compra', path: '/admin/inventario/ordenes', title: 'Órdenes de compra', container: '.admin-page' },
    { label: 'Alertas', path: '/admin/inventario/alertas', title: 'Alertas de inventario', container: '.alertas-contenedor' },
    { label: 'Reportes', path: '/admin/inventario/reportes', title: 'Reportes e Informes', container: '.reportes-container' }
  ];

  beforeEach(() => {
    cy.loginAdmin();
    cy.navigateAdmin('/admin/inventario');
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
  });

  it('muestra los 6 sub-ítems bajo Inventario en el sidenav', () => {
    cy.get('.admin-sidenav .admin-nav-subitem').should('have.length', 6);
    subItems.forEach(({ label, path }) => {
      cy.get('.admin-sidenav').contains('a', label).should('exist');
      cy.get(`.admin-sidenav a[href*="${path}"]`).should('exist');
    });
  });

  subItems.forEach(({ label, path, title, container }) => {
    it(`navega desde sidenav: ${label} → ${path}`, () => {
      cy.get('.admin-sidenav').contains('a', label).click({ force: true });
      cy.url({ timeout: 15000 }).should('include', path);
      cy.get('.loading-container', { timeout: 30000 }).should('not.exist');
      cy.get(container, { timeout: 20000 }).should('exist');
      cy.contains(title, { matchCase: false });
    });
  });
});
