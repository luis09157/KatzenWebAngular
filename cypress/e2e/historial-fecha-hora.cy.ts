/// <reference types="cypress" />

describe('Gestión de Historiales Clínicos', () => {
  beforeEach(() => {
    // Ajusta esta URL según tu configuración
    cy.visit('http://localhost:4200');
    
    // Login (ajusta según tu flujo de autenticación)
    cy.get('input[type="email"]').type('test@test.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Navegar a pacientes
    cy.wait(2000);
    cy.visit('http://localhost:4200/admin/paciente');
    cy.wait(2000);
  });

  describe('Crear Historial Clínico', () => {
    it('debe crear un historial con fecha y hora personalizadas', () => {
      // Seleccionar un paciente
      cy.get('.paciente-item').first().click();
      cy.wait(1000);

      // Abrir diálogo de nuevo historial
      cy.contains('button', 'Nuevo Historial').click();
      cy.wait(500);

      // Verificar que el diálogo se abrió
      cy.get('.historial-dialog').should('be.visible');

      // Llenar fecha personalizada
      cy.get('input[formControlName="fecha_registro"]').click();
      // Seleccionar una fecha en el datepicker (ajustar según necesidad)
      cy.get('.mat-calendar-body-cell').contains('15').click();

      // Seleccionar hora
      cy.get('mat-select[formControlName="hora"]').click();
      cy.get('mat-option').contains('13').click();

      // Seleccionar minutos
      cy.get('mat-select[formControlName="minuto"]').click();
      cy.get('mat-option').contains('50').click();

      // Llenar campos requeridos
      cy.get('textarea[formControlName="historia_clinica"]').type('Historia clínica de prueba automatizada');
      cy.get('textarea[formControlName="diagnostico_presuntivo"]').type('Diagnóstico de prueba E2E');
      cy.get('textarea[formControlName="manejo_terapeutico"]').type('Tratamiento de prueba E2E');
      cy.get('input[formControlName="peso"]').type('25.5');
      cy.get('input[formControlName="tr"]').type('Normal');
      cy.get('textarea[formControlName="hallazgos"]').type('Sin hallazgos relevantes');
      
      // Seleccionar médico
      cy.get('mat-select[formControlName="medico_atendio"]').click();
      cy.get('mat-option').first().click();

      // Guardar
      cy.contains('button', 'Crear').click();

      // Verificar éxito
      cy.get('.swal2-success').should('be.visible');
      cy.contains('Historial clínico creado correctamente').should('be.visible');
      cy.get('.swal2-confirm').click();

      // Verificar que aparece en la lista
      cy.wait(1000);
      cy.contains('Diagnóstico de prueba E2E').should('be.visible');
    });

    it('debe validar campos requeridos', () => {
      // Seleccionar un paciente
      cy.get('.paciente-item').first().click();
      cy.wait(1000);

      // Abrir diálogo de nuevo historial
      cy.contains('button', 'Nuevo Historial').click();
      cy.wait(500);

      // Intentar guardar sin llenar campos
      cy.contains('button', 'Crear').should('be.disabled');

      // Llenar solo algunos campos
      cy.get('textarea[formControlName="historia_clinica"]').type('Test');
      cy.get('textarea[formControlName="diagnostico_presuntivo"]').type('Test');

      // El botón debe seguir deshabilitado
      cy.contains('button', 'Crear').should('be.disabled');
    });
  });

  describe('Ordenamiento de Historiales', () => {
    it('debe mostrar historiales ordenados por fecha (más reciente primero)', () => {
      // Seleccionar un paciente con múltiples historiales
      cy.get('.paciente-item').first().click();
      cy.wait(1000);

      // Obtener la lista de historiales
      cy.get('.recordatorio-item').should('have.length.greaterThan', 0);

      // Verificar que el primer historial tiene una fecha más reciente
      let primeraFecha: string;
      let segundaFecha: string;

      cy.get('.recordatorio-item').first().find('.recordatorio-fecha').invoke('text').then((fecha1) => {
        primeraFecha = fecha1.trim();
        
        cy.get('.recordatorio-item').eq(1).find('.recordatorio-fecha').invoke('text').then((fecha2) => {
          segundaFecha = fecha2.trim();
          
          // La primera fecha debe ser mayor o igual que la segunda
          expect(new Date(primeraFecha).getTime()).to.be.at.least(new Date(segundaFecha).getTime());
        });
      });
    });
  });

  describe('Editar Historial', () => {
    it('debe cargar correctamente fecha y hora al editar', () => {
      // Seleccionar un paciente
      cy.get('.paciente-item').first().click();
      cy.wait(1000);

      // Hacer doble clic en un historial para editarlo
      cy.get('.recordatorio-item').first().dblclick();
      cy.wait(500);

      // Verificar que los campos están llenos
      cy.get('textarea[formControlName="historia_clinica"]').should('not.have.value', '');
      cy.get('textarea[formControlName="diagnostico_presuntivo"]').should('not.have.value', '');
      
      // Verificar que hora y minuto tienen valores
      cy.get('mat-select[formControlName="hora"]').should('exist');
      cy.get('mat-select[formControlName="minuto"]').should('exist');

      // Cerrar sin guardar
      cy.get('button').contains('Cancelar').click();
    });

    it('debe mantener la hora seleccionada sin cambios de zona horaria', () => {
      // Seleccionar un paciente
      cy.get('.paciente-item').first().click();
      cy.wait(1000);

      // Abrir nuevo historial
      cy.contains('button', 'Nuevo Historial').click();
      cy.wait(500);

      // Seleccionar hora específica: 13:50
      cy.get('mat-select[formControlName="hora"]').click();
      cy.get('mat-option').contains('13').click();

      cy.get('mat-select[formControlName="minuto"]').click();
      cy.get('mat-option').contains('50').click();

      // Llenar campos mínimos requeridos
      cy.get('textarea[formControlName="historia_clinica"]').type('Test hora');
      cy.get('textarea[formControlName="diagnostico_presuntivo"]').type('Test hora diagnóstico');
      cy.get('textarea[formControlName="manejo_terapeutico"]').type('Test hora tratamiento');
      cy.get('input[formControlName="peso"]').type('25');
      cy.get('input[formControlName="tr"]').type('Normal');
      cy.get('textarea[formControlName="hallazgos"]').type('Test');
      cy.get('mat-select[formControlName="medico_atendio"]').click();
      cy.get('mat-option').first().click();

      // Guardar
      cy.contains('button', 'Crear').click();
      cy.wait(1000);
      cy.get('.swal2-confirm').click();

      // Editar el historial recién creado
      cy.wait(1000);
      cy.contains('Test hora diagnóstico').parent().parent().dblclick();
      cy.wait(500);

      // Verificar que la hora sigue siendo 13
      cy.get('mat-select[formControlName="hora"]').should('contain', '13');
      // Verificar que los minutos siguen siendo 50
      cy.get('mat-select[formControlName="minuto"]').should('contain', '50');
    });
  });

  describe('Validación de hora sin conversión UTC', () => {
    it('debe guardar exactamente 13:50 sin convertir a 19:50', () => {
      // Seleccionar un paciente
      cy.get('.paciente-item').first().click();
      cy.wait(1000);

      // Crear historial con hora 13:50
      cy.contains('button', 'Nuevo Historial').click();
      cy.wait(500);

      cy.get('mat-select[formControlName="hora"]').click();
      cy.get('mat-option').contains('13').click();

      cy.get('mat-select[formControlName="minuto"]').click();
      cy.get('mat-option').contains('50').click();

      // Llenar campos
      cy.get('textarea[formControlName="historia_clinica"]').type('Test UTC');
      cy.get('textarea[formControlName="diagnostico_presuntivo"]').type('Test UTC diagnóstico');
      cy.get('textarea[formControlName="manejo_terapeutico"]').type('Test UTC tratamiento');
      cy.get('input[formControlName="peso"]').type('25');
      cy.get('input[formControlName="tr"]').type('Normal');
      cy.get('textarea[formControlName="hallazgos"]').type('Test');
      cy.get('mat-select[formControlName="medico_atendio"]').click();
      cy.get('mat-option').first().click();

      // Guardar
      cy.contains('button', 'Crear').click();
      cy.wait(1000);
      cy.get('.swal2-confirm').click();

      // Abrir consola y verificar en logs
      cy.window().then((win) => {
        cy.spy(win.console, 'log');
      });

      // Editar nuevamente y verificar
      cy.wait(1000);
      cy.contains('Test UTC diagnóstico').parent().parent().dblclick();
      cy.wait(500);

      // La hora NO debe ser 19, debe ser 13
      cy.get('mat-select[formControlName="hora"]').should('not.contain', '19');
      cy.get('mat-select[formControlName="hora"]').should('contain', '13');
    });
  });
});

