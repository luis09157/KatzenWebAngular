#!/usr/bin/env node
/**
 * Seed de usuarios de prueba para los EMULADORES Firebase (Auth + RTDB).
 * NUNCA toca producción: aborta si las variables de emulador no están puestas
 * o no apuntan a localhost.
 *
 * Uso (con `npm run emulators` corriendo en otra terminal):
 *   npm run emulators:seed
 *   # equivalente:
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 node scripts/emulator-seed.mjs
 *
 * Crea (idempotente — reejecutar actualiza):
 *   - 3 usuarios Auth: admin staff, recepción staff, cliente portal (passwords abajo).
 *   - Katzen/AuthPerfiles/{uid} + Katzen/Usuarios/{uid} (staff) según provisionStaffUser (functions/src/index.ts).
 *   - Katzen/Cliente/{id} con portalActivo=true + Katzen/Mascota/{id} para el cliente portal.
 *   - Custom claims (role/staffRole/clienteId) como los deja syncClaimsForUid, ya que el
 *     trigger de functions puede no estar emulado.
 *
 * Proyecto/namespace: el emulador Auth asigna todo request con apiKey al proyecto por
 * defecto del CLI (.firebaserc → katzen-a0e3e) y la app Angular usa el namespace RTDB
 * `katzen-a0e3e-default-rtdb`; por eso el seed usa ese projectId. Con las env vars de
 * emulador el Admin SDK enruta TODO a 127.0.0.1 (se verifica antes de escribir).
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const DB_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
const LOCAL = /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/;

function fail(msg, code = 1) {
  console.error(`\n[emulator-seed] ${msg}\n`);
  process.exit(code);
}

// ---- Guard: solo emuladores -------------------------------------------------
if (!AUTH_HOST || !DB_HOST) {
  fail(
    'Faltan FIREBASE_AUTH_EMULATOR_HOST y/o FIREBASE_DATABASE_EMULATOR_HOST.\n' +
      'Este script SOLO escribe en emuladores. Usa: npm run emulators:seed'
  );
}
if (!LOCAL.test(AUTH_HOST) || !LOCAL.test(DB_HOST)) {
  fail(`Hosts de emulador no locales (${AUTH_HOST}, ${DB_HOST}). Abortado.`);
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  fail('GOOGLE_APPLICATION_CREDENTIALS está definida; quítala para el seed (no se usan credenciales reales).');
}

const projectId = process.env.EMULATOR_PROJECT_ID || 'katzen-a0e3e';
const databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;

async function ping(url, label) {
  try {
    // Cualquier respuesta HTTP (incluido 401 por reglas RTDB) significa que el emulador está vivo.
    await fetch(url);
  } catch (err) {
    fail(`Emulador ${label} no responde en ${url} (${err.message}). ¿Corriste "npm run emulators"?`);
  }
}
await ping(`http://${AUTH_HOST}/`, 'Auth');
await ping(`http://${DB_HOST}/.json?ns=${projectId}-default-rtdb&shallow=true`, 'RTDB');

initializeApp({ projectId, databaseURL });
const auth = getAuth();
const db = getDatabase();

const rootUrl = db.ref().toString();
if (!/127\.0\.0\.1|localhost/.test(rootUrl)) {
  fail(`La RTDB resuelta no es emulador: ${rootUrl}. Abortado.`);
}

// ---- Datos de prueba --------------------------------------------------------
const NOW = new Date().toISOString();
const SEED_BY = 'emulator-seed';
const CLIENTE_ID = 'seed-cliente-001';
const MASCOTA_ID = 'seed-mascota-001';

const SEED_USERS = [
  {
    uid: 'seed-admin-uid',
    email: 'admin@katzen.test',
    password: 'Katzen-Admin-2026!',
    displayName: 'Admin Seed',
    kind: 'staff',
    staffRole: 'administrador',
    perfil: 'administrador',
    telefono: '5550000001',
  },
  {
    uid: 'seed-recepcion-uid',
    email: 'recepcion@katzen.test',
    password: 'Katzen-Recep-2026!',
    displayName: 'Recepción Seed',
    kind: 'staff',
    staffRole: 'recepcionista',
    perfil: 'recepcionista',
    telefono: '5550000002',
  },
  {
    uid: 'seed-cliente-uid',
    email: 'cliente@katzen.test',
    password: 'Katzen-Cliente-2026!',
    displayName: 'Ana García Seed',
    kind: 'client',
    clienteId: CLIENTE_ID,
  },
];

async function upsertAuthUser(u) {
  const base = {
    email: u.email,
    password: u.password,
    displayName: u.displayName,
    emailVerified: true,
    disabled: false,
  };
  try {
    await auth.getUser(u.uid);
    await auth.updateUser(u.uid, base);
    return 'actualizado';
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err;
    await auth.createUser({ uid: u.uid, ...base });
    return 'creado';
  }
}

function authPerfilFor(u) {
  if (u.kind === 'staff') {
    return { authUid: u.uid, email: u.email, role: 'staff', roles: ['staff'], staffRole: u.staffRole, activo: true };
  }
  return {
    authUid: u.uid,
    email: u.email,
    role: 'client',
    roles: ['client'],
    clienteId: u.clienteId,
    activo: true,
    mustChangePassword: false,
  };
}

function claimsFor(u) {
  if (u.kind === 'staff') {
    return { role: 'staff', staffRole: u.staffRole, clienteId: null, dualAccess: false, mustChangePassword: false };
  }
  return { role: 'client', staffRole: null, clienteId: u.clienteId, dualAccess: false, mustChangePassword: false };
}

function usuarioFor(u) {
  return {
    id: u.uid,
    authUid: u.uid,
    nombre: u.displayName,
    correo: u.email,
    telefono: u.telefono,
    perfil: u.perfil,
    staffRole: u.staffRole,
    activo: true,
    fecha_registro: NOW,
    created_by: SEED_BY,
  };
}

const clienteSeed = {
  nombre: 'Ana',
  apellidoPaterno: 'García',
  apellidoMaterno: 'Seed',
  telefono: '5551234567',
  correo: 'cliente@katzen.test',
  expediente: 'EXP-SEED-001',
  direccion: 'Calle Ficticia 123, Col. Demo',
  activo: true,
  // Portal (spec 020 / provisionPortalClient)
  authUid: 'seed-cliente-uid',
  portalActivo: true,
  portalEmail: 'cliente@katzen.test',
  portalProvisionedAt: NOW,
  portalProvisionedBy: SEED_BY,
  mustChangePassword: false,
};

const mascotaSeed = {
  nombre: 'Luna',
  especie: 'Canino',
  raza: 'Mestizo',
  sexo: 'Hembra',
  edad: '3 años',
  color: 'Atigrado',
  peso: 12.5,
  idCliente: CLIENTE_ID,
  cliente_id: CLIENTE_ID,
  activo: true,
  fecha_creacion: NOW,
};

// ---- Ejecutar ---------------------------------------------------------------
console.log(`[emulator-seed] Auth ${AUTH_HOST} · RTDB ${rootUrl}`);

const updates = {};
for (const u of SEED_USERS) {
  const estado = await upsertAuthUser(u);
  await auth.setCustomUserClaims(u.uid, claimsFor(u));
  updates[`Katzen/AuthPerfiles/${u.uid}`] = authPerfilFor(u);
  if (u.kind === 'staff') {
    updates[`Katzen/Usuarios/${u.uid}`] = usuarioFor(u);
  }
  console.log(`  ✔ ${u.kind.padEnd(6)} ${u.email.padEnd(24)} uid=${u.uid} (${estado})`);
}
updates[`Katzen/Cliente/${CLIENTE_ID}`] = clienteSeed;
updates[`Katzen/Mascota/${MASCOTA_ID}`] = mascotaSeed;

await db.ref().update(updates);
console.log(`  ✔ Katzen/Cliente/${CLIENTE_ID} (portalActivo=true) + Katzen/Mascota/${MASCOTA_ID}`);

console.log('\nCredenciales de prueba (solo emulador):');
for (const u of SEED_USERS) {
  console.log(`  ${u.email.padEnd(24)} ${u.password}`);
}
console.log('\nListo. Login admin: http://localhost:4200/admin/login · portal: http://localhost:4200/portal\n');

await db.goOffline();
process.exit(0);
