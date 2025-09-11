// Flujos básicos de Baños desde el tab del paciente

describe('Paciente - Baños flujos', () => {
  const url = '/admin/paciente';
  const today = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    // dd/MM/yyyy
    return `${dd}/${mm}/${yyyy}`;
  })();

  beforeEach(() => {
    cy.visit(url);
    cy.contains('Baños').click();
  });

  const getStat = (label: string) =>
    cy
      .contains('.estadisticas-banios .stat-card .stat-label', new RegExp(`^${label}$`, 'i'))
      .parents('.stat-card')
      .find('.stat-number')
      .invoke('text')
      .then((t) => parseInt(t.trim() || '0', 10));

  it('abre diálogo de nuevo baño y valida campos básicos', () => {
    cy.contains('Nuevo Baño').click({ force: true });
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('Programación');
    cy.contains('Servicio');
    // cerrar sin guardar
    cy.get('button').contains('Cancelar').click();
  });

  it('filtra por texto en buscar', () => {
    cy.get('input[matinput]').type('baño', { force: true });
  });

  it('crea, cambia estado y elimina un baño temporal', () => {
    // Tomar métricas iniciales del paciente actual
    let total0 = 0;
    let programados0 = 0;
    let completados0 = 0;

    getStat('Total').then((n) => (total0 = n));
    getStat('Programados').then((n) => (programados0 = n));
    getStat('Completados').then((n) => (completados0 = n));

    // Crear
    cy.contains('Nuevo Baño').click({ force: true });
    cy.get('mat-dialog-container').should('be.visible');

    // Completar campos mínimos
    cy.get('input[formcontrolname="fecha_banio"]').clear({ force: true }).type(today, { force: true });
    cy.get('input[formcontrolname="hora_banio"]').clear({ force: true }).type('13:00', { force: true });
    cy.get('input[formcontrolname="precio_base"]').clear({ force: true }).type('300', { force: true });

    // Peluquero (mat-select)
    cy.get('mat-select[formcontrolname="peluquero_id"]').click({ force: true });
    cy.get('mat-option').first().click({ force: true });

    // Crear
    cy.get('button').contains('Crear').click({ force: true });

    // Verificar que aparece en la lista
    cy.get('.banios-lista .banio-item').should('exist');

    // Validar estadísticas del PACIENTE: total +1 y programados +1
    getStat('Total').should((n) => {
      expect(n).to.eq(total0 + 1);
    });
    getStat('Programados').should((n) => {
      expect(n).to.eq(programados0 + 1);
    });

    // Cambiar estado a En proceso (si existe botón)
    cy.get('body').then(($b) => {
      if ($b.find('button[mattooltip="Iniciar baño"]').length) {
        cy.get('button[mattooltip="Iniciar baño"]').first().click({ force: true });
      }
    });

    // Cambiar estado a Completado (si existe)
    cy.get('body').then(($b) => {
      if ($b.find('button[mattooltip="Completar baño"]').length) {
        cy.get('button[mattooltip="Completar baño"]').first().click({ force: true });
      }
    });

    // Si se completó, esperar que Programados baje (>= programados0) y Completados suba (>= completados0 + 1)
    getStat('Completados').then((n) => {
      if (n >= completados0 + 1) {
        getStat('Programados').should((p) => {
          expect(p).to.be.at.most(programados0); // volvió o bajó
        });
      }
    });

    // Eliminar el registro de prueba
    cy.get('button[mattooltip="Eliminar"]').first().click({ force: true });

    // Confirmar SweetAlert2 si aparece
    cy.get('body').then(($b) => {
      if ($b.find('.swal2-confirm').length) {
        cy.get('.swal2-confirm').click({ force: true });
      }
    });

    // Validar que el total regrese a su valor inicial del paciente
    getStat('Total').should((n) => {
      expect(n).to.eq(total0);
    });
  });
});


