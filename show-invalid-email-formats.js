// Script para mostrar formatos de email inválidos en la base de datos
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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

class EmailFormatAnalyzer {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.database = getDatabase(this.app);
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔄';
    console.log(`${icon} [${timestamp}] ${message}`);
  }

  // Función para validar formato de email
  esEmailValido(email) {
    if (!email || email.trim() === '') return false;
    
    // Considerar como "sin email" estos valores
    const valoresSinEmail = [
      'no proporcionado',
      'sin email',
      'n/a',
      'no disponible',
      'no aplica',
      'sin correo',
      'no tiene email',
      'no tiene correo'
    ];
    
    const emailLower = email.toLowerCase().trim();
    if (valoresSinEmail.some(valor => emailLower.includes(valor))) {
      return false; // No es un email válido, es un indicador de "sin email"
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Función para categorizar tipos de email inválidos
  categorizarEmailInvalido(email) {
    if (!email || email.trim() === '') {
      return { categoria: 'Vacío', descripcion: 'Campo vacío o solo espacios' };
    }
    
    const emailLower = email.toLowerCase().trim();
    
    // Categorías de "sin email"
    if (emailLower.includes('no proporcionado')) {
      return { categoria: 'Sin Email', descripcion: 'Indica que no se proporcionó email' };
    }
    if (emailLower.includes('sin email') || emailLower.includes('sin correo')) {
      return { categoria: 'Sin Email', descripcion: 'Indica que no tiene email' };
    }
    if (emailLower.includes('n/a') || emailLower.includes('no aplica')) {
      return { categoria: 'Sin Email', descripcion: 'Indica que no aplica' };
    }
    
    // Categorías de formato inválido
    if (!email.includes('@')) {
      return { categoria: 'Sin @', descripcion: 'No contiene el símbolo @' };
    }
    if (email.startsWith('@')) {
      return { categoria: 'Sin Usuario', descripcion: 'Empieza con @ (falta usuario)' };
    }
    if (email.endsWith('@')) {
      return { categoria: 'Sin Dominio', descripcion: 'Termina con @ (falta dominio)' };
    }
    if (!email.includes('.')) {
      return { categoria: 'Sin Extensión', descripcion: 'No contiene punto (falta extensión)' };
    }
    if (email.includes('..')) {
      return { categoria: 'Puntos Dobles', descripcion: 'Contiene puntos dobles' };
    }
    if (email.includes(' ')) {
      return { categoria: 'Con Espacios', descripcion: 'Contiene espacios' };
    }
    if (email.includes('@@')) {
      return { categoria: 'Arrobas Dobles', descripcion: 'Contiene @@' };
    }
    
    return { categoria: 'Otro', descripcion: 'Formato inválido no categorizado' };
  }

  async mostrarFormatosInvalidos() {
    this.log('🔍 Analizando formatos de email inválidos en la base de datos...');
    
    try {
      const clientesRef = ref(this.database, 'Katzen/Cliente');
      const snapshot = await get(clientesRef);
      
      if (snapshot.exists()) {
        const clientes = snapshot.val();
        const clientesArray = Object.entries(clientes).map(([id, cliente]) => ({
          id,
          ...cliente
        }));
        
        // Filtrar clientes con emails
        const clientesConEmail = clientesArray.filter(c => c.correo && c.activo !== false);
        
        // Separar emails válidos e inválidos
        const emailsValidos = [];
        const emailsInvalidos = [];
        
        clientesConEmail.forEach(cliente => {
          if (this.esEmailValido(cliente.correo)) {
            emailsValidos.push(cliente);
          } else {
            emailsInvalidos.push(cliente);
          }
        });
        
        this.log(`📊 Estadísticas generales:`, 'info');
        console.log(`   • Total de clientes: ${clientesArray.length}`);
        console.log(`   • Clientes con campo email: ${clientesConEmail.length}`);
        console.log(`   • Emails válidos: ${emailsValidos.length}`);
        console.log(`   • Emails inválidos: ${emailsInvalidos.length}`);
        
        if (emailsInvalidos.length > 0) {
          console.log('\n' + '='.repeat(80));
          console.log('📧 EMAILS INVÁLIDOS ENCONTRADOS:');
          console.log('='.repeat(80));
          
          // Agrupar por categoría
          const categorias = {};
          
          emailsInvalidos.forEach(cliente => {
            const categoria = this.categorizarEmailInvalido(cliente.correo);
            if (!categorias[categoria.categoria]) {
              categorias[categoria.categoria] = {
                descripcion: categoria.descripcion,
                emails: []
              };
            }
            categorias[categoria.categoria].emails.push({
              id: cliente.id,
              nombre: `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''}`.trim(),
              email: cliente.correo,
              telefono: cliente.telefono
            });
          });
          
          // Mostrar por categorías
          Object.entries(categorias).forEach(([categoria, data], index) => {
            console.log(`\n${index + 1}. 📂 CATEGORÍA: ${categoria}`);
            console.log(`   📝 Descripción: ${data.descripcion}`);
            console.log(`   📊 Cantidad: ${data.emails.length} emails`);
            console.log(`   📋 Ejemplos:`);
            
            // Mostrar los primeros 5 ejemplos de cada categoría
            data.emails.slice(0, 5).forEach((email, emailIndex) => {
              console.log(`      ${emailIndex + 1}. "${email.email}"`);
              console.log(`         Cliente: ${email.nombre || 'Sin nombre'} (${email.id})`);
              console.log(`         Teléfono: ${email.telefono || 'Sin teléfono'}`);
            });
            
            if (data.emails.length > 5) {
              console.log(`      ... y ${data.emails.length - 5} más`);
            }
            
            if (index < Object.keys(categorias).length - 1) {
              console.log('\n   ' + '-'.repeat(60));
            }
          });
          
          console.log('\n' + '='.repeat(80));
          
          // Resumen por categorías
          this.log('\n📊 RESUMEN POR CATEGORÍAS:', 'info');
          Object.entries(categorias).forEach(([categoria, data]) => {
            console.log(`   • ${categoria}: ${data.emails.length} emails (${data.descripcion})`);
          });
          
          // Mostrar todos los emails únicos inválidos
          const emailsUnicosInvalidos = [...new Set(emailsInvalidos.map(c => c.correo))];
          this.log(`\n🔢 TOTAL DE EMAILS ÚNICOS INVÁLIDOS: ${emailsUnicosInvalidos.length}`, 'warning');
          
          console.log('\n📋 LISTA COMPLETA DE EMAILS INVÁLIDOS ÚNICOS:');
          emailsUnicosInvalidos.forEach((email, index) => {
            console.log(`   ${index + 1}. "${email}"`);
          });
          
        } else {
          this.log('✅ No se encontraron emails inválidos', 'success');
        }
        
        // Mostrar algunos ejemplos de emails válidos
        if (emailsValidos.length > 0) {
          console.log('\n' + '='.repeat(80));
          console.log('✅ EJEMPLOS DE EMAILS VÁLIDOS:');
          console.log('='.repeat(80));
          
          emailsValidos.slice(0, 10).forEach((cliente, index) => {
            console.log(`   ${index + 1}. "${cliente.correo}" - ${cliente.nombre || 'Sin nombre'}`);
          });
          
          if (emailsValidos.length > 10) {
            console.log(`   ... y ${emailsValidos.length - 10} emails válidos más`);
          }
        }
        
      } else {
        this.log('❌ No se encontraron datos en la base de datos', 'error');
      }
      
    } catch (error) {
      this.log(`❌ Error al analizar emails: ${error.message}`, 'error');
    }
  }
}

// Ejecutar análisis
const analyzer = new EmailFormatAnalyzer();
analyzer.mostrarFormatosInvalidos().catch(console.error);
