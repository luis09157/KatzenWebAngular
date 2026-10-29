/**
 * Spec 115.3 — pruebas de reglas RTDB contra el emulador (CI: .github/workflows/rules-test.yml).
 * Personal (role staff) entra; cliente solo a lo suyo; role «none» (dado de baja), sin rol y sin sesión: fuera.
 * Uso: firebase emulators:exec --only database --project demo-katzen "node scripts/rules-test.mjs"
 */
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, get, set, update, query, orderByChild, equalTo } from 'firebase/database';

const env = await initializeTestEnvironment({
  projectId: 'demo-katzen',
  database: { rules: readFileSync('database.rules.json', 'utf8'), host: '127.0.0.1', port: 9000 },
});

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.database();
  await set(ref(db, 'Katzen/Cliente/c1'), { nombre: 'Ana', activo: true, portalActivo: true });
  await set(ref(db, 'Katzen/Cliente/c2'), { nombre: 'Beto', activo: true });
  await set(ref(db, 'Katzen/Mascota/m1'), { nombre: 'Coco', idCliente: 'c1' });
  await set(ref(db, 'Katzen/Mascota/m2'), { nombre: 'Rex', idCliente: 'c2' });
  await set(ref(db, 'Katzen/Caja/Movimientos/x1'), { monto: 100 });
  await set(ref(db, 'Katzen/AuthPerfiles/uNone'), { role: 'staff', activo: false });
  await set(ref(db, 'Katzen/Usuarios/uNone'), { nombre: 'QA', perfil: 'doctor', activo: false });
});

const staff = env.authenticatedContext('uStaff', { role: 'staff', staffRole: 'doctor' }).database();
const client = env.authenticatedContext('uClient', { role: 'client', clienteId: 'c1' }).database();
const none = env.authenticatedContext('uNone', { role: 'none' }).database();
const sinRol = env.authenticatedContext('uSinRol', {}).database();
const anon = env.unauthenticatedContext().database();

let ok = 0;
const t = async (nombre, p) => {
  try {
    await p;
    ok++;
    console.log('  ✓', nombre);
  } catch (e) {
    console.error('  ✗', nombre, '\n   ', e?.message || e);
    process.exitCode = 1;
  }
};

console.log('Personal');
await t('lee clientes', assertSucceeds(get(ref(staff, 'Katzen/Cliente'))));
await t('escribe un cliente', assertSucceeds(update(ref(staff, 'Katzen/Cliente/c2'), { nota: 'x' })));
await t('lee caja', assertSucceeds(get(ref(staff, 'Katzen/Caja'))));

console.log('Cliente del portal');
await t('NO lee todos los clientes', assertFails(get(ref(client, 'Katzen/Cliente'))));
await t('lee su propia ficha', assertSucceeds(get(ref(client, 'Katzen/Cliente/c1'))));
await t('NO lee la ficha de otro', assertFails(get(ref(client, 'Katzen/Cliente/c2'))));
await t('lee sus mascotas por consulta', assertSucceeds(get(query(ref(client, 'Katzen/Mascota'), orderByChild('idCliente'), equalTo('c1')))));
await t('NO escribe mascotas', assertFails(update(ref(client, 'Katzen/Mascota/m1'), { nombre: 'X' })));

for (const [quien, db] of [
  ['Personal dado de baja (role none)', none],
  ['Cuenta sin rol', sinRol],
  ['Sin sesión', anon],
]) {
  console.log(quien);
  await t('NO lee clientes', assertFails(get(ref(db, 'Katzen/Cliente'))));
  await t('NO escribe clientes', assertFails(update(ref(db, 'Katzen/Cliente/c2'), { nota: 'x' })));
  await t('NO lee caja', assertFails(get(ref(db, 'Katzen/Caja'))));
  await t('NO lee mascotas', assertFails(get(ref(db, 'Katzen/Mascota'))));
}

console.log('Inicio de sesión (antes de tener rol)');
await t('lee su propio AuthPerfil', assertSucceeds(get(ref(none, 'Katzen/AuthPerfiles/uNone'))));
await t('lee su propio Usuario', assertSucceeds(get(ref(none, 'Katzen/Usuarios/uNone'))));

await env.cleanup();
console.log(`\n${ok} pruebas OK${process.exitCode ? ' — HAY FALLAS' : ''}`);
