/**
 * Guard compartido para scripts que tocan PRODUCCIÓN (katzen-a0e3e).
 *
 * Regla (specs/memory/constitution.md): ningún script escribe/lee prod sin
 * confirmación explícita de Luis. Por eso todo script que apunte a prod debe:
 *
 *   import { assertProdConfirmed } from '../lib/guard-prod.mjs';
 *   assertProdConfirmed({ script: 'nombre-script', databaseURL, projectId });
 *
 * Aborta (exit 1) salvo que la variable de entorno CONFIRM_PROD valga
 * exactamente el id del proyecto:
 *
 *   CONFIRM_PROD=katzen-a0e3e node scripts/mi-script.mjs
 *
 * También aborta si hay variables de emulador activas (evita "fingir" prod
 * contra un emulador y viceversa) o si la URL/proyecto no coinciden con prod.
 */

export const PROD_PROJECT_ID = 'katzen-a0e3e';
export const PROD_DATABASE_URL = `https://${PROD_PROJECT_ID}-default-rtdb.firebaseio.com`;
export const CONFIRM_ENV = 'CONFIRM_PROD';

const EMULATOR_VARS = [
  'FIREBASE_DATABASE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIRESTORE_EMULATOR_HOST',
  'FUNCTIONS_EMULATOR'
];

function fail(msg, code = 1) {
  console.error(`\n[guard-prod] ${msg}\n`);
  process.exit(code);
}

/** true si la URL parece emulador local. */
export function looksLikeEmulator(url) {
  return /127\.0\.0\.1|localhost|:9000\b/i.test(String(url || ''));
}

/** true si la confirmación explícita está presente (no aborta). */
export function isProdConfirmed(env = process.env) {
  return env[CONFIRM_ENV] === PROD_PROJECT_ID;
}

/**
 * Aborta el proceso si no hay confirmación explícita para tocar producción.
 * @param {{ script?: string, projectId?: string, databaseURL?: string, allowEmulatorVars?: boolean }} opts
 */
export function assertProdConfirmed(opts = {}) {
  const script = opts.script || 'script';
  const projectId = opts.projectId ?? PROD_PROJECT_ID;
  const databaseURL = opts.databaseURL ?? PROD_DATABASE_URL;

  if (!isProdConfirmed()) {
    fail(
      `${script} apunta a PRODUCCIÓN (${PROD_PROJECT_ID}) y requiere confirmación explícita.\n` +
        `Ejecuta:  ${CONFIRM_ENV}=${PROD_PROJECT_ID} node scripts/... \n` +
        'Sin esa variable no se toca prod (constitución KatzenVet).'
    );
  }

  if (projectId !== PROD_PROJECT_ID) {
    fail(`${script}: projectId "${projectId}" no es ${PROD_PROJECT_ID}. Revisa la config.`);
  }

  if (!new RegExp(PROD_PROJECT_ID, 'i').test(databaseURL) || looksLikeEmulator(databaseURL)) {
    fail(`${script}: databaseURL "${databaseURL}" no es la RTDB de producción (o parece emulador).`);
  }

  if (!opts.allowEmulatorVars) {
    const activos = EMULATOR_VARS.filter((v) => process.env[v]);
    if (activos.length) {
      fail(
        `${script}: hay variables de emulador activas (${activos.join(', ')}). ` +
          'Un script de prod no debe correr con emuladores configurados. Haz unset y reintenta.'
      );
    }
  }

  console.log(`[guard-prod] ${script}: confirmación ${CONFIRM_ENV} OK → ${projectId}`);
}
