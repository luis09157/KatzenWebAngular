#!/usr/bin/env node
/**
 * Provisiona / desactiva usuarios staff efímeros para smoke 008.
 * Uso:
 *   node scripts/smoke-008-provision-roles.mjs provision
 *   node scripts/smoke-008-provision-roles.mjs rtdb-probe
 *   node scripts/smoke-008-provision-roles.mjs deactivate
 *
 * Lee adminEmail/adminPassword de cypress.env.json.
 * Escribe emails (y passwords) en cypress.env.smoke-roles.json (gitignored).
 * Nunca imprime passwords.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDatabase, ref, push, set, remove } from 'firebase/database';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const CYPRESS_ENV = resolve(root, 'cypress.env.json');
const SMOKE_ENV = resolve(root, 'cypress.env.smoke-roles.json');
const RESULTS = resolve(root, 'specs/008-rtdb-permisos-granulares/smoke-roles-rtdb-probe.json');

const firebaseConfig = {
  apiKey: 'AIzaSyDhRLUEpcjpt820tZ15helJVM5SuLUqwCY',
  authDomain: 'katzen-a0e3e.firebaseapp.com',
  databaseURL: 'https://katzen-a0e3e-default-rtdb.firebaseio.com',
  projectId: 'katzen-a0e3e',
};

const ROLES = ['doctor', 'recepcionista', 'peluquero'];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  let out = 'Qa8!';
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function redactLog(msg) {
  console.log(String(msg).replace(/password["']?\s*[:=]\s*["'][^"']+["']/gi, 'password:[REDACTED]'));
}

async function asAdmin() {
  const env = loadJson(CYPRESS_ENV);
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error('Faltan adminEmail/adminPassword en cypress.env.json');
  }
  const app = initializeApp(firebaseConfig, `smoke-admin-${Date.now()}`);
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, env.adminEmail, env.adminPassword);
  const fns = getFunctions(app, 'us-central1');
  return { app, auth, fns, env };
}

async function provision() {
  const stamp = Date.now();
  const { auth, fns } = await asAdmin();
  const provisionStaffUser = httpsCallable(fns, 'provisionStaffUser');
  const users = {};

  for (const perfil of ROLES) {
    const email = `qa+smoke008.${perfil}.${stamp}@katzenvet.test`;
    const password = randomPassword();
    redactLog(`[provision] creando perfil=${perfil} email=${email}`);
    try {
      const res = await provisionStaffUser({
        email,
        password,
        nombre: `QA Smoke ${perfil}`,
        telefono: '5500000008',
        perfil,
      });
      const data = res.data || {};
      users[perfil] = {
        email,
        password,
        uid: data.uid,
        staffRole: data.staffRole,
        createdAt: new Date().toISOString(),
      };
      redactLog(`[provision] OK ${perfil} uid=${data.uid} staffRole=${data.staffRole}`);
    } catch (err) {
      const code = err?.code || err?.message || String(err);
      console.error(`[provision] FAIL ${perfil}: ${code}`);
      throw err;
    }
  }

  writeFileSync(
    SMOKE_ENV,
    JSON.stringify(
      {
        doctorEmail: users.doctor.email,
        doctorPassword: users.doctor.password,
        doctorUid: users.doctor.uid,
        recepcionistaEmail: users.recepcionista.email,
        recepcionistaPassword: users.recepcionista.password,
        recepcionistaUid: users.recepcionista.uid,
        peluqueroEmail: users.peluquero.email,
        peluqueroPassword: users.peluquero.password,
        peluqueroUid: users.peluquero.uid,
        provisionedAt: new Date().toISOString(),
      },
      null,
      2
    ) + '\n',
    { mode: 0o600 }
  );

  // Merge keys into cypress.env.json for Cypress (still gitignored)
  const cy = loadJson(CYPRESS_ENV);
  Object.assign(cy, {
    doctorEmail: users.doctor.email,
    doctorPassword: users.doctor.password,
    recepcionistaEmail: users.recepcionista.email,
    recepcionistaPassword: users.recepcionista.password,
    peluqueroEmail: users.peluquero.email,
    peluqueroPassword: users.peluquero.password,
  });
  writeFileSync(CYPRESS_ENV, JSON.stringify(cy, null, 2) + '\n', { mode: 0o600 });

  await signOut(auth);
  console.log('[provision] credenciales escritas en cypress.env.json + cypress.env.smoke-roles.json (gitignored)');
  console.log(
    JSON.stringify(
      {
        doctor: { email: users.doctor.email, uid: users.doctor.uid },
        recepcionista: { email: users.recepcionista.email, uid: users.recepcionista.uid },
        peluquero: { email: users.peluquero.email, uid: users.peluquero.uid },
      },
      null,
      2
    )
  );
}

async function deactivate() {
  if (!existsSync(SMOKE_ENV)) {
    console.log('[deactivate] no hay cypress.env.smoke-roles.json — nada que desactivar');
    return;
  }
  const smoke = loadJson(SMOKE_ENV);
  const { auth, fns } = await asAdmin();
  const updateStaffUser = httpsCallable(fns, 'updateStaffUser');
  for (const perfil of ROLES) {
    const uid = smoke[`${perfil}Uid`];
    if (!uid) continue;
    try {
      await updateStaffUser({ uid, activo: false });
      console.log(`[deactivate] OK ${perfil} uid=${uid}`);
    } catch (err) {
      console.error(`[deactivate] FAIL ${perfil}: ${err?.message || err}`);
    }
  }
  await signOut(auth);
}

async function probeRole(perfil, email, password) {
  const app = initializeApp(firebaseConfig, `probe-${perfil}-${Date.now()}`);
  const auth = getAuth(app);
  const db = getDatabase(app);
  await signInWithEmailAndPassword(auth, email, password);
  // Forzar token fresco con claims
  await auth.currentUser.getIdToken(true);
  const token = await auth.currentUser.getIdTokenResult(true);
  const claims = {
    role: token.claims.role,
    staffRole: token.claims.staffRole ?? null,
  };

  const attempts = [
    { node: 'Citas', path: 'Katzen/Citas' },
    { node: 'Historiales_Clinicos', path: 'Katzen/Historiales_Clinicos' },
    { node: 'Inventario', path: 'Katzen/Inventario/_smoke008_probe' },
    { node: 'Banios', path: 'Katzen/Banios' },
    { node: 'Vacunas', path: 'Katzen/Vacunas' },
  ];

  const results = {};
  for (const a of attempts) {
    const probeRef = a.node === 'Inventario' ? ref(db, a.path) : push(ref(db, a.path));
    const payload =
      a.node === 'Inventario'
        ? { _smoke: true, ts: Date.now(), note: 'smoke-008-probe-do-not-use' }
        : {
            _smoke008: true,
            activo: false,
            fecha: new Date().toISOString(),
            nota: 'smoke-008-probe-ephemeral',
          };
    try {
      await set(probeRef, payload);
      // Cleanup inmediato si el write pasó
      try {
        await remove(probeRef);
      } catch {
        /* ignore cleanup errors */
      }
      results[a.node] = 'ALLOW';
    } catch (err) {
      const msg = String(err?.message || err?.code || err);
      results[a.node] = /PERMISSION_DENIED|permission-denied/i.test(msg) ? 'DENIED' : `ERROR:${msg.slice(0, 80)}`;
    }
  }

  await signOut(auth);
  return { perfil, email, claims, writes: results };
}

async function rtdbProbe() {
  if (!existsSync(SMOKE_ENV) && !existsSync(CYPRESS_ENV)) {
    throw new Error('No hay credenciales smoke');
  }
  const cy = loadJson(CYPRESS_ENV);
  const smoke = existsSync(SMOKE_ENV) ? loadJson(SMOKE_ENV) : {};
  const creds = {
    doctor: {
      email: smoke.doctorEmail || cy.doctorEmail,
      password: smoke.doctorPassword || cy.doctorPassword,
    },
    recepcionista: {
      email: smoke.recepcionistaEmail || cy.recepcionistaEmail,
      password: smoke.recepcionistaPassword || cy.recepcionistaPassword,
    },
    peluquero: {
      email: smoke.peluqueroEmail || cy.peluqueroEmail,
      password: smoke.peluqueroPassword || cy.peluqueroPassword,
    },
  };

  const report = { ranAt: new Date().toISOString(), roles: [] };
  for (const perfil of ROLES) {
    const c = creds[perfil];
    if (!c?.email || !c?.password) {
      report.roles.push({ perfil, status: 'SKIP', reason: 'sin credenciales' });
      continue;
    }
    redactLog(`[rtdb-probe] ${perfil} email=${c.email}`);
    const row = await probeRole(perfil, c.email, c.password);
    report.roles.push({ status: 'OK', ...row, email: c.email });
    console.log(
      JSON.stringify(
        { perfil, claims: row.claims, writes: row.writes },
        null,
        2
      )
    );
  }

  writeFileSync(RESULTS, JSON.stringify(report, null, 2) + '\n');
  console.log(`[rtdb-probe] resultados → ${RESULTS}`);
}

const cmd = process.argv[2] || 'provision';
const runners = { provision, deactivate, 'rtdb-probe': rtdbProbe };
if (!runners[cmd]) {
  console.error(`Comando desconocido: ${cmd}. Usa: provision | rtdb-probe | deactivate`);
  process.exit(1);
}
runners[cmd]().catch((err) => {
  console.error('[fatal]', err?.code || '', err?.message || err);
  process.exit(1);
});
