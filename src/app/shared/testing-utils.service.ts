import { Injectable } from '@angular/core';
import { ValidationService } from './validation.service';

@Injectable({
  providedIn: 'root'
})
export class TestingUtilsService {

  constructor(private validationService: ValidationService) { }

  // ===== TESTING DE VALIDACIONES DE VACUNAS =====
  
  testVacunasValidations() {
    console.log('🧪 TESTING: Validaciones de Vacunas');
    
    const testCases = [
      {
        name: 'Vacuna válida',
        data: {
          idPaciente: 'test-paciente-1',
          vacuna: 'Quíntuple',
          fechaAplicacion: '2025-01-15'
        },
        expected: true
      },
      {
        name: 'Vacuna sin paciente',
        data: {
          vacuna: 'Quíntuple',
          fechaAplicacion: '2025-01-15'
        },
        expected: false
      },
      {
        name: 'Vacuna sin nombre',
        data: {
          idPaciente: 'test-paciente-1',
          fechaAplicacion: '2025-01-15'
        },
        expected: false
      },
      {
        name: 'Vacuna con fecha inválida',
        data: {
          idPaciente: 'test-paciente-1',
          vacuna: 'Quíntuple',
          fechaAplicacion: 'fecha-invalida'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('vacuna', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE CITAS =====
  
  testCitasValidations() {
    console.log('🧪 TESTING: Validaciones de Citas');
    
    const testCases = [
      {
        name: 'Cita válida',
        data: {
          paciente_id: 'test-paciente-1',
          fecha: '2025-02-15',
          hora: '14:30'
        },
        expected: true
      },
      {
        name: 'Cita sin paciente',
        data: {
          fecha: '2025-02-15',
          hora: '14:30'
        },
        expected: false
      },
      {
        name: 'Cita con fecha pasada',
        data: {
          paciente_id: 'test-paciente-1',
          fecha: '2020-01-01',
          hora: '14:30'
        },
        expected: false
      },
      {
        name: 'Cita con hora inválida',
        data: {
          paciente_id: 'test-paciente-1',
          fecha: '2025-02-15',
          hora: '25:70'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('cita', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE CLIENTES =====
  
  testClientesValidations() {
    console.log('🧪 TESTING: Validaciones de Clientes');
    
    const testCases = [
      {
        name: 'Cliente válido',
        data: {
          nombre: 'Juan Pérez',
          correo: 'juan@example.com',
          telefono: '8123456789'
        },
        expected: true
      },
      {
        name: 'Cliente sin nombre',
        data: {
          correo: 'juan@example.com',
          telefono: '8123456789'
        },
        expected: false
      },
      {
        name: 'Cliente con email inválido',
        data: {
          nombre: 'Juan Pérez',
          correo: 'email-invalido',
          telefono: '8123456789'
        },
        expected: false
      },
      {
        name: 'Cliente con teléfono inválido',
        data: {
          nombre: 'Juan Pérez',
          correo: 'juan@example.com',
          telefono: '123'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('cliente', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE BAÑOS =====
  
  testBaniosValidations() {
    console.log('🧪 TESTING: Validaciones de Baños');
    
    const testCases = [
      {
        name: 'Baño válido',
        data: {
          paciente_id: 'test-paciente-1',
          fecha_banio: '2025-02-15',
          hora_banio: '14:30',
          precio_total: 150
        },
        expected: true
      },
      {
        name: 'Baño sin paciente',
        data: {
          fecha_banio: '2025-02-15',
          hora_banio: '14:30',
          precio_total: 150
        },
        expected: false
      },
      {
        name: 'Baño con fecha pasada',
        data: {
          paciente_id: 'test-paciente-1',
          fecha_banio: '2020-01-01',
          hora_banio: '14:30',
          precio_total: 150
        },
        expected: false
      },
      {
        name: 'Baño con precio negativo',
        data: {
          paciente_id: 'test-paciente-1',
          fecha_banio: '2025-02-15',
          hora_banio: '14:30',
          precio_total: -50
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('banio', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE HISTORIALES =====
  
  testHistorialesValidations() {
    console.log('🧪 TESTING: Validaciones de Historiales');
    
    const testCases = [
      {
        name: 'Historial válido',
        data: {
          paciente_id: 'test-paciente-1',
          diagnostico_presuntivo: 'Resfriado común'
        },
        expected: true
      },
      {
        name: 'Historial sin paciente',
        data: {
          diagnostico_presuntivo: 'Resfriado común'
        },
        expected: false
      },
      {
        name: 'Historial sin diagnóstico',
        data: {
          paciente_id: 'test-paciente-1'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('historial', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE RECORDATORIOS =====
  
  testRecordatoriosValidations() {
    console.log('🧪 TESTING: Validaciones de Recordatorios');
    
    const testCases = [
      {
        name: 'Recordatorio válido',
        data: {
          paciente_id: 'test-paciente-1',
          titulo: 'Vacuna anual',
          fecha_hora_recordatorio: '2025-02-15 14:30:00'
        },
        expected: true
      },
      {
        name: 'Recordatorio sin paciente',
        data: {
          titulo: 'Vacuna anual',
          fecha_hora_recordatorio: '2025-02-15 14:30:00'
        },
        expected: false
      },
      {
        name: 'Recordatorio sin título',
        data: {
          paciente_id: 'test-paciente-1',
          fecha_hora_recordatorio: '2025-02-15 14:30:00'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('recordatorio', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE USUARIOS =====
  
  testUsuariosValidations() {
    console.log('🧪 TESTING: Validaciones de Usuarios');
    
    const testCases = [
      {
        name: 'Usuario válido',
        data: {
          nombre: 'Dr. García',
          correo: 'dr.garcia@katzen.mx',
          perfil: 'doctor'
        },
        expected: true
      },
      {
        name: 'Usuario sin nombre',
        data: {
          correo: 'dr.garcia@katzen.mx',
          perfil: 'doctor'
        },
        expected: false
      },
      {
        name: 'Usuario con email inválido',
        data: {
          nombre: 'Dr. García',
          correo: 'email-invalido',
          perfil: 'doctor'
        },
        expected: false
      },
      {
        name: 'Usuario sin perfil',
        data: {
          nombre: 'Dr. García',
          correo: 'dr.garcia@katzen.mx'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('usuario', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== TESTING DE VALIDACIONES DE PACIENTES =====
  
  testPacientesValidations() {
    console.log('🧪 TESTING: Validaciones de Pacientes');
    
    const testCases = [
      {
        name: 'Paciente válido',
        data: {
          nombre: 'Luna',
          especie: 'Perro',
          cliente_id: 'test-cliente-1'
        },
        expected: true
      },
      {
        name: 'Paciente sin nombre',
        data: {
          especie: 'Perro',
          cliente_id: 'test-cliente-1'
        },
        expected: false
      },
      {
        name: 'Paciente sin especie',
        data: {
          nombre: 'Luna',
          cliente_id: 'test-cliente-1'
        },
        expected: false
      },
      {
        name: 'Paciente sin cliente',
        data: {
          nombre: 'Luna',
          especie: 'Perro'
        },
        expected: false
      }
    ];

    testCases.forEach(testCase => {
      const errors = this.validationService.validateRequiredFields('paciente', testCase.data);
      const isValid = errors.length === 0;
      const status = isValid === testCase.expected ? '✅ PASÓ' : '❌ FALLÓ';
      
      console.log(`${status} ${testCase.name}:`, {
        expected: testCase.expected,
        actual: isValid,
        errors: errors
      });
    });
  }

  // ===== EJECUTAR TODOS LOS TESTS =====
  
  runAllTests() {
    console.log('🚀 INICIANDO TESTING COMPLETO DEL SISTEMA ADMIN');
    console.log('=' .repeat(60));
    
    this.testVacunasValidations();
    console.log('-'.repeat(40));
    
    this.testCitasValidations();
    console.log('-'.repeat(40));
    
    this.testClientesValidations();
    console.log('-'.repeat(40));
    
    this.testBaniosValidations();
    console.log('-'.repeat(40));
    
    this.testHistorialesValidations();
    console.log('-'.repeat(40));
    
    this.testRecordatoriosValidations();
    console.log('-'.repeat(40));
    
    this.testUsuariosValidations();
    console.log('-'.repeat(40));
    
    this.testPacientesValidations();
    console.log('-'.repeat(40));
    
    console.log('=' .repeat(60));
    console.log('🏁 TESTING COMPLETADO');
  }

  // ===== TESTING DE VALIDACIONES DE FORMATO =====
  
  testFormatValidations() {
    console.log('🧪 TESTING: Validaciones de Formato');
    
    // Test de emails
    const emails = [
      { email: 'test@example.com', expected: true },
      { email: 'invalid-email', expected: false },
      { email: 'test@', expected: false },
      { email: '@example.com', expected: false },
      { email: 'test.example.com', expected: false }
    ];
    
    emails.forEach(test => {
      const isValid = this.validationService.isValidEmail(test.email);
      const status = isValid === test.expected ? '✅ PASÓ' : '❌ FALLÓ';
      console.log(`${status} Email: ${test.email} -> ${isValid}`);
    });
    
    // Test de teléfonos
    const phones = [
      { phone: '8123456789', expected: true },
      { phone: '+528123456789', expected: true },
      { phone: '528123456789', expected: true },
      { phone: '123', expected: false },
      { phone: 'abcdefghij', expected: false }
    ];
    
    phones.forEach(test => {
      const isValid = this.validationService.isValidPhoneMX(test.phone);
      const status = isValid === test.expected ? '✅ PASÓ' : '❌ FALLÓ';
      console.log(`${status} Teléfono: ${test.phone} -> ${isValid}`);
    });
    
    // Test de fechas
    const dates = [
      { date: '2025-02-15', expected: true },
      { date: '2025-13-45', expected: false },
      { date: 'invalid-date', expected: false },
      { date: '2025/02/15', expected: false }
    ];
    
    dates.forEach(test => {
      const isValid = this.validationService.isValidDateFormat(test.date);
      const status = isValid === test.expected ? '✅ PASÓ' : '❌ FALLÓ';
      console.log(`${status} Fecha: ${test.date} -> ${isValid}`);
    });
    
    // Test de horas
    const times = [
      { time: '14:30', expected: true },
      { time: '09:15', expected: true },
      { time: '25:70', expected: false },
      { time: '14:60', expected: false },
      { time: 'invalid-time', expected: false }
    ];
    
    times.forEach(test => {
      const isValid = this.validationService.isValidTimeFormat(test.time);
      const status = isValid === test.expected ? '✅ PASÓ' : '❌ FALLÓ';
      console.log(`${status} Hora: ${test.time} -> ${isValid}`);
    });
  }
}
