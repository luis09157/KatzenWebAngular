#!/usr/bin/env node
/**
 * Anti-patrón LoadingService (spec 005 US-3):
 *   loadingService.show(...);
 *   this.dialogRef.close(...);
 * sin hide en medio → overlay trabado si el padre no hace hide (p. ej. Llegó un paciente).
 *
 * Uso: npm run check:loading
 * Exit 1 si encuentra coincidencias en src/app.
 *
 * Alcance deliberado: solo el patrón show→close (regex fiable).
 * NO intenta detectar await Swal / navigator.share / jspdf entre show y hide
 * (try/finally arbitrarios → heurística frágil). Esa regla vive en docs + revisión:
 * ADMIN-UI-ARCHITECTURE § Loading regla 4, agent-guardrails, spec 005 US-4 / 092.
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
