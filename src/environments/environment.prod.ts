export const environment = {
  production: true,
  firebase: {
    // Tu configuración de Firebase para producción
    // Asegúrate de que estos valores estén configurados correctamente
    apiKey: "TU_API_KEY_PRODUCCION",
    authDomain: "tu-proyecto.firebaseapp.com",
    databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  },
  // Configuraciones específicas de producción
  appConfig: {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    environment: 'production',
    enableLogging: false,
    enableDebug: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerHistorial: 5
  }
}; 