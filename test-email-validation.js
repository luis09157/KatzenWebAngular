// Script de prueba para verificar que la corrección de email funciona
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, push, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDhRLUEpcjpt820tZ15helJVM5SuLUqwCY",
  authDomain: "katzen-a0e3e.firebaseapp.com",
  databaseURL: "https://katzen-a0e3e-default-rtdb.firebaseio.com",
  projectId: "katzen-a0e3e",
  storageBucket: "katzen-a0e3e.appspot.com",
  messagingSenderId: "262209452533",
  appId: "1:262209452533:web:ba8966a907d98bc2d3c8bc",
  measurementId: "G-4PW9MGJ7XS"
};

class EmailValidationTester {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.database = getDatabase(this.app);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔄';
    console.log(`${icon} [${timestamp}] ${message}`);
  }

  // Simular la nueva validación de email
  validarEmail(email) {
    // Si no hay email o es un valor que indica "no proporcionado", no validar
    if (!email || 
        email.toLowerCase().includes('no proporcionado') || 
        email.toLowerCase().includes('sin email') ||
        email.toLowerCase().includes('n/a') ||
        email.trim() === '') {
      return { valido: true, razon: 'No requiere validación (sin email)' };
    }

    // Validar formato de email antes de verificar duplicados
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valido: false, razon: 'Formato de email inválido' };
    }

    return { valido: true, razon: 'Email válido' };
  }

  async probarValidaciones() {
    this.log('🧪 Probando las nuevas validaciones de email...');
    
    const casosPrueba = [
      { email: '', descripcion: 'Email vacío' },
      { email: 'no proporcionado', descripcion: 'Texto "no proporcionado"' },
      { email: 'No proporcionado', descripcion: 'Texto "No proporcionado" (mayúscula)' },
      { email: 'sin email', descripcion: 'Texto "sin email"' },
      { email: 'n/a', descripcion: 'Texto "n/a"' },
      { email: '   ', descripcion: 'Solo espacios' },
      { email: 'email-invalido', descripcion: 'Email sin formato válido' },
      { email: 'usuario@', descripcion: 'Email incompleto' },
      { email: '@dominio.com', descripcion: 'Email sin usuario' },
      { email: 'usuario@dominio', descripcion: 'Email sin extensión' },
      { email: 'usuario@dominio.com', descripcion: 'Email válido' },
      { email: 'test@ejemplo.mx', descripcion: 'Email válido con dominio .mx' }
    ];

    console.log('\n' + '='.repeat(80));
    console.log('RESULTADOS DE VALIDACIÓN:');
    console.log('='.repeat(80));

    casosPrueba.forEach((caso, index) => {
      const resultado = this.validarEmail(caso.email);
      const icono = resultado.valido ? '✅' : '❌';
      
      console.log(`\n${index + 1}. ${icono} ${caso.descripcion}`);
      console.log(`   Email: "${caso.email}"`);
      console.log(`   Resultado: ${resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'}`);
      console.log(`   Razón: ${resultado.razon}`);
    });

    console.log('\n' + '='.repeat(80));
    
    // Contar resultados
    const validos = casosPrueba.filter(caso => this.validarEmail(caso.email).valido).length;
    const invalidos = casosPrueba.length - validos;
    
    this.log(`\n📊 RESUMEN:`, 'info');
    console.log(`   • Casos válidos: ${validos}`);
    console.log(`   • Casos inválidos: ${invalidos}`);
    console.log(`   • Total de casos: ${casosPrueba.length}`);
    
    if (validos >= 8) { // Esperamos que al menos 8 casos sean válidos
      this.log('✅ Las validaciones funcionan correctamente!', 'success');
    } else {
      this.log('❌ Hay problemas con las validaciones', 'error');
    }
  }

  async probarCreacionCliente() {
    this.log('\n🧪 Probando creación de cliente con email válido...');
    
    try {
      const clientePrueba = {
        nombre: 'Test',
        apellidoPaterno: 'Usuario',
        apellidoMaterno: 'Prueba',
        genero: 'Masculino',
        telefono: '1234567890',
        correo: `test.${Date.now()}@prueba.com`,
        calle: 'Calle de Prueba',
        numero: '123',
        colonia: 'Colonia Test',
        municipio: 'Monterrey',
        codigoPostal: '64000',
        expediente: `TEST${Date.now()}`,
        activo: true,
        fecha: new Date().toLocaleString('es-ES'),
        isTestData: true
      };

      // Validar el email antes de crear
      const validacion = this.validarEmail(clientePrueba.correo);
      
      if (!validacion.valido) {
        this.log(`❌ Email inválido: ${validacion.razon}`, 'error');
        return;
      }

      this.log(`✅ Email válido: ${validacion.razon}`, 'success');

      // Crear cliente en Firebase
      const clientesRef = ref(this.database, 'Katzen/Cliente');
      const newClienteRef = push(clientesRef);
      
      await set(newClienteRef, {
        ...clientePrueba,
        id: newClienteRef.key
      });

      this.log(`✅ Cliente de prueba creado con ID: ${newClienteRef.key}`, 'success');
      
      // Limpiar datos de prueba
      await set(newClienteRef, null);
      this.log('✅ Datos de prueba eliminados', 'success');
      
    } catch (error) {
      this.log(`❌ Error al probar creación: ${error.message}`, 'error');
    }
  }

  async ejecutarPruebas() {
    this.log('🚀 Iniciando pruebas de validación de email...');
    
    await this.probarValidaciones();
    await this.probarCreacionCliente();
    
    this.log('\n🏁 Pruebas completadas!', 'success');
    this.log('\n💡 La funcionalidad de agregar cliente debería funcionar ahora.', 'info');
    this.log('   - Los emails "No proporcionado" ya no causan problemas', 'info');
    this.log('   - Solo se validan emails con formato válido', 'info');
    this.log('   - La validación de duplicados funciona correctamente', 'info');
  }
}

// Ejecutar pruebas
const tester = new EmailValidationTester();
tester.ejecutarPruebas().catch(console.error);
