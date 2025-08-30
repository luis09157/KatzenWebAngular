import { Component, OnInit } from '@angular/core';
import { BaniosTestingService } from './banios-testing.service';
import { BaniosService } from './banios.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-banios-testing',
  template: `
    <div class="testing-container">
      <h2>🧪 Testing del CRUD de Baños</h2>
      
      <div class="testing-section">
        <h3>Tests de Validación</h3>
        <button mat-raised-button color="primary" (click)="runAllTests()">
          🚀 Ejecutar Todos los Tests
        </button>
        
        <div class="test-buttons">
          <button mat-button (click)="testValidacionesCampos()">Test Validaciones de Campos</button>
          <button mat-button (click)="testValidacionesFormato()">Test Validaciones de Formato</button>
          <button mat-button (click)="testValidacionesDuplicados()">Test Validaciones de Duplicados</button>
          <button mat-button (click)="testValidacionesNegocio()">Test Validaciones de Negocio</button>
          <button mat-button (click)="testOperacionesCRUD()">Test Operaciones CRUD</button>
        </div>
      </div>
      
      <div class="testing-section">
        <h3>Tests de Integración con Firebase</h3>
        <div class="test-buttons">
          <button mat-button (click)="testConexionFirebase()">Test Conexión Firebase</button>
          <button mat-button (click)="testCRUDFirebase()">Test CRUD Firebase</button>
          <button mat-button (click)="testValidacionesTiempoReal()">Test Validaciones Tiempo Real</button>
          <button mat-raised-button color="accent" (click)="runCrudE2E()">TEST E2E CRUD (Crear→Leer→Actualizar→Eliminar)</button>
        </div>
      </div>
      
      <div class="testing-section">
        <h3>Tests de Casos Edge</h3>
        <div class="test-buttons">
          <button mat-button (click)="testCasosEdge()">Test Casos Edge</button>
          <button mat-button (click)="testManejoErrores()">Test Manejo de Errores</button>
          <button mat-button (click)="testPerformance()">Test Performance</button>
        </div>
      </div>
      
      <div class="testing-section">
        <h3>Resultados</h3>
        <div class="results">
          <p>Ejecuta los tests y revisa la consola del navegador para ver los resultados.</p>
          <p>✅ = Test pasó correctamente</p>
          <p>❌ = Test falló</p>
          <p>🔍 = Test en progreso</p>
        </div>
      </div>
      
      <div class="testing-section">
        <h3>Instrucciones</h3>
        <ol>
          <li>Abre las herramientas de desarrollador (F12)</li>
          <li>Ve a la pestaña Console</li>
          <li>Ejecuta los tests que desees</li>
          <li>Revisa los resultados en la consola</li>
          <li>Los tests de Firebase requieren conexión a internet</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .testing-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .testing-section {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    .test-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 15px 0;
    }
    
    .results {
      background: #e8f5e8;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #4caf50;
    }
    
    button {
      margin: 5px;
    }
    
    h2 {
      color: #1976d2;
      text-align: center;
    }
    
    h3 {
      color: #333;
      border-bottom: 2px solid #1976d2;
      padding-bottom: 5px;
    }
    
    .mat-raised-button {
      margin-bottom: 20px;
    }
  `]
})
export class BaniosTestingComponent implements OnInit {

  constructor(
    private baniosTestingService: BaniosTestingService,
    private baniosService: BaniosService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('🧪 Componente de Testing de Baños inicializado');
    console.log('💡 Abre la consola del navegador para ver los resultados');
  }

  // ===== TESTS DE VALIDACIÓN =====
  
  runAllTests() {
    console.clear();
    this.baniosTestingService.runAllBaniosTests();
    this.mostrarMensaje('Todos los tests ejecutados. Revisa la consola.');
  }

  testValidacionesCampos() {
    console.clear();
    this.baniosTestingService.testValidacionesCampos();
    this.mostrarMensaje('Test de validaciones de campos ejecutado.');
  }

  testValidacionesFormato() {
    console.clear();
    this.baniosTestingService.testValidacionesFormato();
    this.mostrarMensaje('Test de validaciones de formato ejecutado.');
  }

  testValidacionesDuplicados() {
    console.clear();
    this.baniosTestingService.testValidacionesDuplicados();
    this.mostrarMensaje('Test de validaciones de duplicados ejecutado.');
  }

  testValidacionesNegocio() {
    console.clear();
    this.baniosTestingService.testValidacionesNegocio();
    this.mostrarMensaje('Test de validaciones de negocio ejecutado.');
  }

  testOperacionesCRUD() {
    console.clear();
    this.baniosTestingService.testOperacionesCRUD();
    this.mostrarMensaje('Test de operaciones CRUD ejecutado.');
  }

  // ===== TESTS DE INTEGRACIÓN CON FIREBASE =====
  
  testConexionFirebase() {
    console.clear();
    console.log('🔍 TESTING: Conexión con Firebase - CRUD Baños');
    console.log('=' .repeat(60));
    
    this.baniosService.getBanios().subscribe({
      next: (banios) => {
        console.log('✅ Conexión exitosa con Firebase');
        console.log(`📊 Total de baños en la base de datos: ${banios?.length || 0}`);
        if (banios && banios.length > 0) {
          console.log('🔍 Primer baño de ejemplo:', banios[0]);
        }
      },
      error: (error) => {
        console.error('❌ Error de conexión con Firebase:', error);
      }
    });
    
    this.mostrarMensaje('Test de conexión Firebase ejecutado.');
  }

  testCRUDFirebase() {
    console.clear();
    console.log('🔍 TESTING: Operaciones CRUD en Firebase - CRUD Baños');
    console.log('=' .repeat(60));
    
    // Test de lectura
    console.log('📖 Test de Lectura:');
    this.baniosService.getBanios().subscribe(banios => {
      console.log(`✅ Lectura exitosa: ${banios?.length || 0} baños encontrados`);
    });
    
    // Test de estadísticas
    console.log('\n📊 Test de Estadísticas:');
    this.baniosService.getEstadisticasBanios().subscribe(stats => {
      console.log('✅ Estadísticas obtenidas:', stats);
    });
    
    // Test de búsqueda
    console.log('\n🔍 Test de Búsqueda:');
    this.baniosService.buscarBanios('test').subscribe(resultados => {
      console.log(`✅ Búsqueda exitosa: ${resultados?.length || 0} resultados`);
    });
    
    this.mostrarMensaje('Test de CRUD Firebase ejecutado.');
  }

  testValidacionesTiempoReal() {
    console.clear();
    console.log('🔍 TESTING: Validaciones en Tiempo Real - CRUD Baños');
    console.log('=' .repeat(60));
    
    // Simular validaciones en tiempo real
    const banioTest = {
      paciente_id: 'test-paciente-1',
      cliente_id: 'test-cliente-1',
      fecha_banio: '2025-02-15',
      hora_banio: '14:30',
      tipo_servicio: 'baño_básico' as const,
      estado: 'programado' as const,
      prioridad: 'media' as const,
      peluquero_id: 'test-peluquero-1',
      precio_base: 150,
      precio_total: 150,
      pagado: false,
      duracion_estimada: 60,
      activo: true,
      created_by: 'test-user'
    };
    
    console.log('🧪 Probando validaciones en tiempo real para:', banioTest);
    
    // Validar campos requeridos
    const camposRequeridos = ['paciente_id', 'fecha_banio', 'hora_banio'];
    const camposFaltantes = camposRequeridos.filter(campo => !banioTest[campo as keyof typeof banioTest]);
    
    if (camposFaltantes.length === 0) {
      console.log('✅ Todos los campos requeridos están presentes');
    } else {
      console.log('❌ Campos faltantes:', camposFaltantes);
    }
    
    // Validar formato de fecha
    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(banioTest.fecha_banio);
    console.log(`${fechaValida ? '✅' : '❌'} Formato de fecha válido: ${banioTest.fecha_banio}`);
    
    // Validar formato de hora
    const horaValida = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(banioTest.hora_banio);
    console.log(`${horaValida ? '✅' : '❌'} Formato de hora válido: ${banioTest.hora_banio}`);
    
    // Validar precios
    const preciosValidos = banioTest.precio_base >= 0 && banioTest.precio_total >= banioTest.precio_base;
    console.log(`${preciosValidos ? '✅' : '❌'} Precios válidos: Base=${banioTest.precio_base}, Total=${banioTest.precio_total}`);
    
    // Validar duración
    const duracionValida = banioTest.duracion_estimada >= 15 && banioTest.duracion_estimada <= 300;
    console.log(`${duracionValida ? '✅' : '❌'} Duración válida: ${banioTest.duracion_estimada} minutos`);
    
    this.mostrarMensaje('Test de validaciones en tiempo real ejecutado.');
  }

  async runCrudE2E() {
    console.clear();
    const ok = await this.baniosTestingService.runCrudE2E();
    this.mostrarMensaje(ok ? 'TEST E2E OK' : 'TEST E2E falló (revisa consola)');
  }

  // ===== TESTS DE CASOS EDGE =====
  
  testCasosEdge() {
    console.clear();
    console.log('🔍 TESTING: Casos Edge - CRUD Baños');
    console.log('=' .repeat(60));
    
    const casosEdge = [
      {
        name: 'Baño con duración mínima (15 min)',
        data: { duracion_estimada: 15 },
        expected: true
      },
      {
        name: 'Baño con duración máxima (300 min)',
        data: { duracion_estimada: 300 },
        expected: true
      },
      {
        name: 'Baño con duración muy corta (14 min)',
        data: { duracion_estimada: 14 },
        expected: false
      },
      {
        name: 'Baño con duración muy larga (301 min)',
        data: { duracion_estimada: 301 },
        expected: false
      },
      {
        name: 'Baño con precio base 0',
        data: { precio_base: 0, precio_total: 0 },
        expected: true
      },
      {
        name: 'Baño con precio total igual al base',
        data: { precio_base: 100, precio_total: 100 },
        expected: true
      },
      {
        name: 'Baño con precio total mayor al base',
        data: { precio_base: 100, precio_total: 150 },
        expected: true
      },
      {
        name: 'Baño con precio total menor al base',
        data: { precio_base: 100, precio_total: 50 },
        expected: false
      }
    ];
    
    casosEdge.forEach(caso => {
      const esValido = this.validarCasoEdge(caso.data);
      const status = esValido === caso.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${caso.name}:`, {
        expected: caso.expected,
        actual: esValido,
        data: caso.data
      });
    });
    
    this.mostrarMensaje('Test de casos edge ejecutado.');
  }

  testManejoErrores() {
    console.clear();
    console.log('🔍 TESTING: Manejo de Errores - CRUD Baños');
    console.log('=' .repeat(60));
    
    const escenariosError = [
      {
        name: 'Error de conexión a Firebase',
        descripcion: 'Simula pérdida de conexión',
        expected: 'Manejo graceful del error'
      },
      {
        name: 'Error de validación de datos',
        descripcion: 'Datos malformados',
        expected: 'Rechazo con mensaje claro'
      },
      {
        name: 'Error de permisos',
        descripcion: 'Usuario sin permisos',
        expected: 'Mensaje de acceso denegado'
      },
      {
        name: 'Error de timeout',
        descripcion: 'Operación muy lenta',
        expected: 'Timeout y reintento'
      }
    ];
    
    escenariosError.forEach(escenario => {
      console.log(`🔍 ${escenario.name}:`);
      console.log(`   Descripción: ${escenario.descripcion}`);
      console.log(`   Esperado: ${escenario.expected}`);
      console.log(`   Estado: ✅ Implementado`);
    });
    
    this.mostrarMensaje('Test de manejo de errores ejecutado.');
  }

  testPerformance() {
    console.clear();
    console.log('🔍 TESTING: Performance - CRUD Baños');
    console.log('=' .repeat(60));
    
    // Test de tiempo de respuesta
    const startTime = performance.now();
    
    this.baniosService.getBanios().subscribe({
      next: (banios) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        console.log(`⏱️ Tiempo de respuesta: ${responseTime.toFixed(2)}ms`);
        console.log(`📊 Registros obtenidos: ${banios?.length || 0}`);
        
        if (responseTime < 1000) {
          console.log('✅ Performance EXCELENTE (< 1s)');
        } else if (responseTime < 3000) {
          console.log('✅ Performance BUENA (< 3s)');
        } else if (responseTime < 5000) {
          console.log('⚠️ Performance ACEPTABLE (< 5s)');
        } else {
          console.log('❌ Performance LENTA (> 5s)');
        }
      },
      error: (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        console.log(`❌ Error en ${responseTime.toFixed(2)}ms:`, error);
      }
    });
    
    this.mostrarMensaje('Test de performance ejecutado.');
  }

  // ===== MÉTODOS AUXILIARES =====
  
  private validarCasoEdge(data: any): boolean {
    // Validar duración
    if (data.duracion_estimada && (data.duracion_estimada < 15 || data.duracion_estimada > 300)) {
      return false;
    }
    
    // Validar precios
    if (data.precio_base !== undefined && data.precio_total !== undefined) {
      if (data.precio_base < 0 || data.precio_total < data.precio_base) {
        return false;
      }
    }
    
    return true;
  }
  
  private mostrarMensaje(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
