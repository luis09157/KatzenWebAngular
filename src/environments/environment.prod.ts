export const environment = {
  production: true,
  firebase: {
    apiKey: "AIzaSyDhRLUEpcjpt820tZ15helJVM5SuLUqwCY",
    authDomain: "katzen-a0e3e.firebaseapp.com",
    databaseURL: "https://katzen-a0e3e-default-rtdb.firebaseio.com",
    projectId: "katzen-a0e3e",
    storageBucket: "katzen-a0e3e.appspot.com",
    messagingSenderId: "262209452533",
    appId: "1:262209452533:web:ba8966a907d98bc2d3c8bc",
    measurementId: "G-4PW9MGJ7XS"
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
  },
  // App Check - reCAPTCHA
  recaptchaSiteKey: '6LdQ-jgsAAAAAPwzjmTm2U-WyZuL96S3Em4wEACA',
  defaultSucursalId: 'principal',
  sucursales: [
    { id: 'principal', nombre: 'Katzen Principal' }
  ]
}; 