#!/usr/bin/env node
/**
 * Arranca los emuladores Firebase locales (nunca producción).
 *
 *   npm run emulators          → auth + database
 *   npm run emulators:full     → auth + database + functions (compila functions antes)
 *
 * Persistencia: `./emulator-data` (gitignored). Si ya existe un export previo se
 * importa; al salir (Ctrl+C) se vuelve a exportar (`--export-on-exit`).
 * Primer arranque (sin export) → parte vacío y luego `npm run emulators:seed`.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const dataDir = resolve(root, 'emulator-data');
const only = process.argv[2] || 'auth,database';

// Proyecto: por defecto el de .firebaserc (katzen-a0e3e). Los emuladores son 100% locales;
// se mantiene el mismo id para que el emulador Auth (asigna cualquier apiKey al proyecto por
// defecto) y el namespace RTDB `katzen-a0e3e-default-rtdb` coincidan con lo que usa `ng serve`.
const args = ['emulators:start', '--only', only, '--export-on-exit', dataDir];
if (process.env.EMULATOR_PROJECT_ID) {
  args.push('--project', process.env.EMULATOR_PROJECT_ID);
}
if (existsSync(resolve(dataDir, 'firebase-export-metadata.json'))) {
  args.push('--import', dataDir);
  console.log(`[emulators] importando export previo desde ${dataDir}`);
} else {
  console.log(`[emulators] sin export previo; arranque vacío (luego: npm run emulators:seed)`);
}

const child = spawn('npx', ['firebase', ...args], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
