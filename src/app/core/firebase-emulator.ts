import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/functions';
import { environment } from '../../environments/environment';

/** Puertos por defecto de `firebase emulators:start` (ver `firebase.json` → emulators). */
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORTS = { auth: 9099, database: 9000, functions: 5001 } as const;

function safeConnect(label: string, connect: () => void): void {
  try {
    connect();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Reintentos idempotentes (HMR, doble init) no son error.
    if (/already been called|already initialized/i.test(msg)) {
      return;
    }
    // Cualquier otro fallo significa que la app seguiría apuntando a PRODUCCIÓN: hacerlo visible.
    console.error(`[KatzenVet] No se pudo conectar ${label} al emulador. La app puede estar apuntando a producción.`, msg);
  }
}

/**
 * `AngularFireModule.initializeApp()` crea la app de forma perezosa (al inyectar el primer servicio),
 * así que en `APP_INITIALIZER` todavía no existe `[DEFAULT]`. La creamos aquí con la misma config:
 * AngularFire reutiliza la app existente por nombre, no la duplica.
 */
function ensureDefaultApp(): void {
  if (!firebase.apps.length) {
    firebase.initializeApp(environment.firebase);
  }
}

/**
 * Spec 064: el `ng serve` local puede apuntar a los emuladores Firebase (nunca en prod).
 * Bajo `environment.useRtdbEmulator` conecta RTDB, Auth y Functions al emulador local
 * para no tocar `katzen-a0e3e`. Seed de usuarios de prueba: `npm run emulators:seed`.
 */
export function connectRtdbEmulatorIfEnabled(): void {
  if (environment.production || !environment.useRtdbEmulator) {
    return;
  }
  ensureDefaultApp();
  safeConnect('RTDB', () => firebase.database().useEmulator(EMULATOR_HOST, EMULATOR_PORTS.database));
  safeConnect('Auth', () => firebase.auth().useEmulator(`http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`));
  // Sin región explícita: misma instancia por defecto que usa AngularFireFunctions (REGION no provista).
  safeConnect('Functions', () => firebase.app().functions().useEmulator(EMULATOR_HOST, EMULATOR_PORTS.functions));
}
