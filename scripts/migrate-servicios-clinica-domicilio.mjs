#!/usr/bin/env node
/**
 * Spec 093 Fase 2 / SC-008 — migración suave:
 *   Katzen/ServiciosClinica/{id} con tipo: 'domicilio'
 *   → tipo: 'consulta' + esDomicilio: true  (aditivo; no borra otros campos)
 *
 * Lógica alineada con `planPatchMigracionDomicilio` en
 * `src/app/servicios-clinica/servicios-clinica.util.ts`.
 *
 * SEGURIDAD (constitución KatzenVet):
 *   - Default = dry-run (solo lista; NO escribe).
 *   - Emulador: requiere FIREBASE_DATABASE_EMULATOR_HOST local + `--apply`.
 *   - Producción: SOLO Luis. Requiere `--apply` + CONFIRM_PROD=katzen-a0e3e
 *     + MIGRATE_CONFIRM=LUIS. El agente NUNCA debe ejecutar apply en prod.
 *
 * Uso:
 *   # Dry-run local contra emulador (recomendado):
 *   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
 *     node scripts/migrate-servicios-clinica-domicilio.mjs
 *
 *   # Apply en emulador:
 *   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
 *     node scripts/migrate-servicios-clinica-domicilio.mjs --apply
 *
 *   # Dry-run prod (solo lectura; Luis):
 *   CONFIRM_PROD=katzen-a0e3e GOOGLE_APPLICATION_CREDENTIALS=... \
 *     node scripts/migrate-servicios-clinica-domicilio.mjs --target=prod
 *
 *   # Apply prod (Luis explícito):
 *   CONFIRM_PROD=katzen-a0e3e MIGRATE_CONFIRM=LUIS GOOGLE_APPLICATION_CREDENTIALS=... \
 *     node scripts/migrate-servicios-clinica-domicilio.mjs --target=prod --apply
 */
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { assertProdConfirmed, looksLikeEmulator, PROD_DATABASE_URL, PROD_PROJECT_ID } from './lib/guard-prod.mjs';

const PATH = 'Katzen/ServiciosClinica';
const LOCAL = /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/;
const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const TARGET_PROD = args.has('--target=prod') || process.env.MIGRATE_TARGET === 'prod';

function fail(msg, code = 1) {
  console.error(`\n[migrate-093] ${msg}\n`);
  process.exit(code);
}

/** Mirror de planPatchMigracionDomicilio (util Angular). */
function planPatch(raw, now) {
  if (!raw || String(raw.tipo) !== 'domicilio') {
    return { needsMigration: false };
  }
  return {
    needsMigration: true,
    patch: {
      tipo: 'consulta',
      esDomicilio: true,
      updated_at: now,
    },
  };
}

function planBatch(map, now) {
  const items = [];
  let yaOk = 0;
  const entries = Object.entries(map || {});
  for (const [id, raw] of entries) {
    if (!raw || typeof raw !== 'object') continue;
    const plan = planPatch(raw, now);
    if (!plan.needsMigration) {
      yaOk += 1;
      continue;
    }
    items.push({
      id,
      nombre: String(raw.nombre || '').trim() || id,
      patch: plan.patch,
    });
  }
  return { total: entries.length, aMigrar: items.length, yaOk, items };
}

function resolveTarget() {
  const dbHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  if (TARGET_PROD) {
    if (dbHost) {
      fail('No combines --target=prod con FIREBASE_DATABASE_EMULATOR_HOST. Unset emulador vars.');
    }
    assertProdConfirmed({
      script: 'migrate-servicios-clinica-domicilio',
      projectId: PROD_PROJECT_ID,
      databaseURL: PROD_DATABASE_URL,
    });
    if (APPLY && process.env.MIGRATE_CONFIRM !== 'LUIS') {
      fail(
        'Apply en prod requiere MIGRATE_CONFIRM=LUIS además de CONFIRM_PROD=katzen-a0e3e.\n' +
          'Dry-run: omite --apply. El agente no debe ejecutar apply en prod.'
      );
    }
    return {
      mode: 'prod',
      projectId: PROD_PROJECT_ID,
      databaseURL: PROD_DATABASE_URL,
    };
  }

  if (!dbHost) {
    fail(
      'Falta FIREBASE_DATABASE_EMULATOR_HOST (emulador) o usa --target=prod con confirmación Luis.\n' +
        'Ejemplo dry-run emulador:\n' +
        '  FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 node scripts/migrate-servicios-clinica-domicilio.mjs'
    );
  }
  if (!LOCAL.test(dbHost)) {
    fail(`Host de emulador no local: ${dbHost}`);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    fail('Quita GOOGLE_APPLICATION_CREDENTIALS para correr contra emulador.');
  }
  const projectId = process.env.EMULATOR_PROJECT_ID || 'katzen-a0e3e';
  return {
    mode: 'emulator',
    projectId,
    databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
  };
}

const target = resolveTarget();
initializeApp({ projectId: target.projectId, databaseURL: target.databaseURL });
const db = getDatabase();
const rootUrl = db.ref().toString();

if (target.mode === 'emulator' && !looksLikeEmulator(rootUrl)) {
  fail(`RTDB resuelta no es emulador: ${rootUrl}`);
}
if (target.mode === 'prod' && looksLikeEmulator(rootUrl)) {
  fail(`RTDB resuelta parece emulador en modo prod: ${rootUrl}`);
}

const now = new Date().toISOString();
console.log(`[migrate-093] mode=${target.mode} apply=${APPLY} path=${PATH} at=${now}`);
console.log(`[migrate-093] databaseURL resuelta → ${rootUrl}`);

const snap = await db.ref(PATH).get();
const map = snap.exists() ? snap.val() : {};
const batch = planBatch(map, now);

console.log(`[migrate-093] nodos=${batch.total} aMigrar=${batch.aMigrar} yaOk=${batch.yaOk}`);
for (const item of batch.items) {
  console.log(`  - ${item.id} «${item.nombre}» → tipo=${item.patch.tipo} esDomicilio=true`);
}

if (!APPLY) {
  console.log(
    '\n[migrate-093] DRY-RUN: sin escrituras. Para aplicar en emulador añade --apply.\n' +
      'Prod: solo Luis con CONFIRM_PROD=katzen-a0e3e MIGRATE_CONFIRM=LUIS --target=prod --apply\n'
  );
  process.exit(0);
}

if (batch.aMigrar === 0) {
  console.log('[migrate-093] Nada que migrar. Exit 0.');
  process.exit(0);
}

let ok = 0;
for (const item of batch.items) {
  await db.ref(`${PATH}/${item.id}`).update(item.patch);
  ok += 1;
  console.log(`[migrate-093] updated ${item.id}`);
}
console.log(`[migrate-093] APPLY OK: ${ok}/${batch.aMigrar} nodos. Exit 0.`);
process.exit(0);
