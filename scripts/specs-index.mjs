#!/usr/bin/env node
// Genera specs/INDEX.md a partir de cada specs/NNN-<nombre>/spec.md.
// Extrae número, nombre de carpeta, título (H1) y línea `Estado:`.
// Uso: node scripts/specs-index.mjs   (sin dependencias externas)
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const specsDir = join(root, 'specs');
const outFile = join(specsDir, 'INDEX.md');

const dirs = readdirSync(specsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{3}-/.test(d.name))
  .map((d) => d.name)
  .sort();

const rows = [];
const conteo = {};

for (const dir of dirs) {
  const specPath = join(specsDir, dir, 'spec.md');
  const numero = dir.slice(0, 3);
  const nombre = dir.slice(4);
  let titulo = nombre;
  let estado = 'sin spec.md';

  if (existsSync(specPath)) {
    const texto = readFileSync(specPath, 'utf8');
    const h1 = texto.match(/^#\s+(.+)$/m);
    if (h1) titulo = h1[1].replace(/^Spec:\s*/i, '').trim();
    const est = texto.match(/^\*{0,2}Estado:?\*{0,2}\s*:?\s*(.+?)\s*$/m);
    estado = est ? est[1].replace(/\s+$/, '') : 'sin Estado';
  }

  const clave = estado.split(/[\s(→]/)[0].toLowerCase() || estado;
  conteo[clave] = (conteo[clave] ?? 0) + 1;
  rows.push(`| ${numero} | [${nombre}](${dir}/spec.md) | ${titulo.replace(/\|/g, '\\|')} | ${estado.replace(/\|/g, '\\|')} |`);
}

const resumen = Object.entries(conteo)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `\`${k}\`: ${v}`)
  .join(' · ');

const contenido = `# Índice de specs — KatzenVet

> **Autogenerado** por \`node scripts/specs-index.mjs\` a partir de \`specs/NNN-*/spec.md\`. **No editar a mano**: cambia el \`Estado:\` en la spec y regenera.

Total: **${rows.length}** specs · ${resumen}

| # | Carpeta | Título | Estado |
|---|---------|--------|--------|
${rows.join('\n')}
`;

writeFileSync(outFile, contenido, 'utf8');
console.log(`specs/INDEX.md regenerado: ${rows.length} specs (${resumen})`);
