/** Smoke: rutas admin protegidas redirigen a login o cargan sin error fatal. */
describe('Admin CRUD routes smoke', () => {
  const adminRoutes = [
    '/admin/inicio',
    '/admin/clientes',
    '/admin/pacientes-admin',
    '/admin/paciente',
    '/admin/citas',
    '/admin/historiales',
    '/admin/vacunas',
    '/admin/recordatorios',
    '/admin/banios',
    '/admin/inventario',
    '/admin/inventario/productos',
    '/admin/inventario/movimientos',
    '/admin/inventario/proveedores',
    '/admin/inventario/ordenes',
    '/admin/inventario/alertas',
    '/admin/contactos-web',
    '/admin/usuarios'
  ];

  adminRoutes.forEach(route => {
    it(`responde ${route} sin error de app`, () => {
      cy.visit(route, { failOnStatusCode: false });
      cy.get('body').should('exist');
      // Sin sesión debe terminar en login admin o mostrar shell de login
      cy.url().should('match', /\/(admin\/login|admin\/)/);
      cy.get('mat-spinner', { timeout: 15000 }).should('not.exist');
    });
  });
});
