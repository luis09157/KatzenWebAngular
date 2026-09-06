export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyDhRLUEpcjpt820tZ15helJVM5SuLUqwCY',
    authDomain: 'katzen-a0e3e.firebaseapp.com',
    databaseURL: 'https://katzen-a0e3e-default-rtdb.firebaseio.com',
    projectId: 'katzen-a0e3e',
    storageBucket: 'katzen-a0e3e.appspot.com',
    messagingSenderId: '262209452533',
    appId: '1:262209452533:web:ba8966a907d98bc2d3c8bc',
    measurementId: 'G-4PW9MGJ7XS',
  },
  // App Check - reCAPTCHA
  recaptchaSiteKey: '6LdQ-jgsAAAAAPwzjmTm2U-WyZuL96S3Em4wEACA',
  defaultSucursalId: 'principal',
  sucursales: [{ id: 'principal', nombre: 'Katzen Principal' }],
  /** FCM web portal (spec 023 fase B). Obtener en Firebase Console → Cloud Messaging → Web Push certificates. */
  fcmVapidKey: 'BDYW7j0lsqgQJLaZvqYQtimllZBg2Kqp3ySTeLuJvDBr792Twchl8kbE7jyjojdmUrMD3KAvl8Tvyr4ZueSaRNk',
  /** Spec 052: push programado (D-7 / D-0). Si false, 023 al write sin gate de vacuna. */
  pushProgramadoEnabled: true,
  /**
   * POS 055/069: catálogo de muestra. OFF en localhost→prod.
   * Encender solo con emulador RTDB si necesitas preview UI sin SKU reales.
   */
  usarCatalogoDemoPos: false,
  /**
   * Spec 064/074: `false` = Auth + RTDB + Functions de katzen-a0e3e (misma clínica que prod).
   * Encender (`true`) solo para PDV/seed local. `environment.prod.ts` siempre false.
   */
  useRtdbEmulator: false,
  /**
   * Auth emu OFF: cuentas reales de la clínica no existen en el emulador.
   * Encender solo para seed (`cliente@katzen.test` / `npm run emulators:seed`) con RTDB emu.
   */
  useAuthEmulator: false,
  /** Teléfono público landing/portal (spec 074). Config/clinica no es legible por dueño. */
  clinicaTelefono: '8136024090',
  clinicaTelefonoDisplay: '81 3602 4090',
};
