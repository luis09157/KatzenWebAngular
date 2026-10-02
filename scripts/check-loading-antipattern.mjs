#!/usr/bin/env node
/**
 * Anti-patrón LoadingService (spec 005):
 *   loadingService.show(...);
 *   this.dialogRef.close(...);
 * sin hide en medio → overlay trabado si el padre no hace hide (p. ej. Llegó un paciente).
 *
 * Uso: npm run check:loading
 * Exit 1 si encuentra coincidencias en src/app.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pattern = String.raw`loadingService\.show\([^;]*\);\s*\n\s*this\.dialogRef\.close`;

try {
  const out = execSync(`rg -U --glob '*.ts' -n '${pattern}' src/app || true`, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  }).trim();
  if (out) {
    console.error('❌ Anti-patrón LoadingService (show → close sin hide):\n');
    console.error(out);
    console.error('\nRegla: show durante la async + hide en finally; luego close. Spec 005.');
    process.exit(1);
  }
  console.log('OK: sin show() inmediatamente antes de dialogRef.close()');
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
