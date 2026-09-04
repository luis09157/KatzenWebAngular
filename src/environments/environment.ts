export const environment = {
  production: false,
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
  // App Check - reCAPTCHA
  recaptchaSiteKey: '6LdQ-jgsAAAAAPwzjmTm2U-WyZuL96S3Em4wEACA',
  defaultSucursalId: 'principal',
  sucursales: [
    { id: 'principal', nombre: 'Katzen Principal' }
  ],
  /** FCM web portal (spec 023 fase B). Obtener en Firebase Console → Cloud Messaging → Web Push certificates. */
  fcmVapidKey: 'BDYW7j0lsqgQJLaZvqYQtimllZBg2Kqp3ySTeLuJvDBr792Twchl8kbE7jyjojdmUrMD3KAvl8Tvyr4ZueSaRNk',
  /** Spec 052: push programado (D-7 / D-0). Si false, 023 al write sin gate de vacuna. */
  pushProgramadoEnabled: true,
  /**
   * POS 055: catálogo de muestra local (6 ítems `demo-pos-*`).
   * Solo preview UI — no se guarda en inventario. Default ON en localhost.
   */
  /**
   * POS 055: catálogo de muestra local (6 ítems `demo-pos-*`).
   * Solo preview UI — no se guarda en inventario. Default ON en localhost.
   */
  usarCatalogoDemoPos: true,
  /**
   * Spec 064: `ng serve` lee el emulador RTDB (685 SKU eleventa), no katzen-a0e3e.
   * Auth sigue en Firebase real. Apagar (`false`) para volver a ver la clínica de prod.
   * `environment.prod.ts` siempre false.
   */
  useRtdbEmulator: true
}; 