import { Component, OnInit } from '@angular/core';
import { TestingUtilsService } from './testing-utils.service';

@Component({
  selector: 'app-testing',
  template: `
    <div class="testing-container">
      <h2>🧪 Testing del Sistema Admin</h2>
      
      <div class="testing-section">
        <h3>Validaciones de Entidades</h3>
        <button mat-raised-button color="primary" (click)="runAllTests()">
          🚀 Ejecutar Todos los Tests
        </button>
        
        <button mat-raised-button color="accent" (click)="testFormatValidations()">
          🔍 Test de Formatos
        </button>
      </div>
      
      <div class="testing-section">
        <h3>Tests Individuales</h3>
        <div class="test-buttons">
          <button mat-button (click)="testVacunas()">Test Vacunas</button>
          <button mat-button (click)="testCitas()">Test Citas</button>
          <button mat-button (click)="testClientes()">Test Clientes</button>
          <button mat-button (click)="testBanios()">Test Baños</button>
          <button mat-button (click)="testHistoriales()">Test Historiales</button>
          <button mat-button (click)="testRecordatorios()">Test Recordatorios</button>
          <button mat-button (click)="testUsuarios()">Test Usuarios</button>
          <button mat-button (click)="testPacientes()">Test Pacientes</button>
        </div>
      </div>
      
      <div class="testing-section">
        <h3>Resultados</h3>
        <div class="results">
          <p>Ejecuta los tests y revisa la consola del navegador para ver los resultados.</p>
          <p>✅ = Test pasó correctamente</p>
          <p>❌ = Test falló</p>
        </div>
      </div>
      
      <div class="testing-section">
        <h3>Instrucciones</h3>
        <ol>
          <li>Abre las herramientas de desarrollador (F12)</li>
          <li>Ve a la pestaña Console</li>
          <li>Ejecuta los tests que desees</li>
          <li>Revisa los resultados en la consola</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .testing-container {
      padding: 20px;
      max-width: 800px;
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
  `]
})
export class TestingComponent implements OnInit {

  constructor(private testingService: TestingUtilsService) { }

  ngOnInit(): void {
    console.log('🧪 Componente de Testing inicializado');
    console.log('💡 Abre la consola del navegador para ver los resultados');
  }

  runAllTests() {
    console.clear();
    this.testingService.runAllTests();
  }

  testFormatValidations() {
    console.clear();
    this.testingService.testFormatValidations();
  }

  testVacunas() {
    console.clear();
    this.testingService.testVacunasValidations();
  }

  testCitas() {
    console.clear();
    this.testingService.testCitasValidations();
  }

  testClientes() {
    console.clear();
    this.testingService.testClientesValidations();
  }

  testBanios() {
    console.clear();
    this.testingService.testBaniosValidations();
  }

  testHistoriales() {
    console.clear();
    this.testingService.testHistorialesValidations();
  }

  testRecordatorios() {
    console.clear();
    this.testingService.testRecordatoriosValidations();
  }

  testUsuarios() {
    console.clear();
    this.testingService.testUsuariosValidations();
  }

  testPacientes() {
    console.clear();
    this.testingService.testPacientesValidations();
  }
}
