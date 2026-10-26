#!/usr/bin/env node
/**
 * Detector estático de fallos móviles (sin dependencias).
 *
 * Uso:  npm run check:mobile            → reporte; exit 1 si hay ERROR
 *       npm run check:mobile -- --json  → salida JSON
 *
 * ERROR (bloquea):
 *   media-override-pierde   Regla dentro de @media (max-width ≤ 900) con !important que NUNCA aplica,
 *                           porque otra regla fuera del media, misma propiedad + !important, tiene
 *                           mayor especificidad sobre el mismo elemento. (Caso real: «Nuevo paciente»
 *                           con campos de 43px en celular.)
 *   dialog-80vw             Uso de var(--mat-dialog-container-max-width) en width: Material lo deja en 80vw
 *                           y el diálogo mide 300px en un teléfono de 375.
 *
 * AVISO (no bloquea; se revisa en la spec móvil):
 *   tabla-ancha-movil       min-width > 600px dentro de un @media de celular (tabla que obliga a deslizar).
 *   vh-sin-dvh              height/max-height con 100vh sin el respaldo 100dvh en la misma regla (iOS corta).
 *   dblclick-sin-tap        (dblclick) en un elemento sin (click): en celular no hay doble clic.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const MOBILE_MAX = 900;
const asJson = process.argv.includes('--json');

function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x)) && !e.name.endsWith('.spec.ts')) out.push(p);
  }
  return out;
}

/* ───────── parser CSS/SCSS mínimo (bloques anidados, & y @media) ───────── */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function lineAt(src, idx) {
  let n = 1;
  for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) n++;
  return n;
}

function splitSelectors(sel) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function combine(parents, child) {
  const kids = splitSelectors(child);
  if (!parents.length) return kids;
  const res = [];
  for (const p of parents) for (const k of kids) res.push(k.includes('&') ? k.replace(/&/g, p) : `${p} ${k}`);
  return res;
}

function parse(src) {
  const rules = [];
  let i = 0;
  function block(parents, media) {
    let buf = '';
    let start = i;
    while (i < src.length) {
      const ch = src[i];
      if (ch === '{') {
        const head = buf.trim();
        const headIdx = start;
        i++;
        buf = '';
        if (head.startsWith('@media')) {
          const m = head.match(/max-width:\s*(\d+)px/);
          const minm = head.match(/min-width:\s*(\d+)px/);
          block(parents, { text: head, max: m ? +m[1] : null, min: minm ? +minm[1] : null });
        } else if (head.startsWith('@')) {
          block(parents, media); // @supports, @container, @keyframes… se recorren tal cual
        } else {
          const sels = combine(parents, head);
          const declStart = i;
          const decls = block(sels, media);
          rules.push({ selectors: sels, media, decls, line: lineAt(src, headIdx), declStart });
        }
        start = i;
        continue;
      }
      if (ch === '}') {
        const decls = parseDecls(buf);
        i++;
        return decls;
      }
      if (ch === ';') {
        // declaración a este nivel: acumular para el bloque actual
        buf += ch;
        i++;
        continue;
      }
      buf += ch;
      i++;
    }
    return parseDecls(buf);
  }
  block([], null);
  return rules;
}

function parseDecls(buf) {
  const decls = [];
  // quitar sub-bloques ya procesados (lo que queda son declaraciones)
  for (const raw of buf.split(';')) {
    const m = raw.match(/^\s*([a-z-]+)\s*:\s*([\s\S]+?)\s*$/i);
    if (!m) continue;
    const prop = m[1].toLowerCase();
    let value = m[2].replace(/\s+/g, ' ');
    const important = /!important\s*$/.test(value);
    value = value.replace(/\s*!important\s*$/, '');
    decls.push({ prop, value, important });
  }
  return decls;
}

/* ───────── especificidad ───────── */
function specificity(sel) {
  let s = sel.replace(/::?[a-z-]+\((?:[^()]|\([^()]*\))*\)/gi, (m) => {
    // :not()/:is()/:has() cuentan su argumento; :where() cuenta 0
    if (/^:where/i.test(m)) return ' ';
    const inner = m.replace(/^::?[a-z-]+\(|\)$/gi, '');
    const sp = specificity(inner);
    return ` ${'#x'.repeat(sp[0])}${'.x'.repeat(sp[1])}${' x'.repeat(sp[2])} `;
  });
  const a = (s.match(/#[\w-]+/g) || []).length;
  const b = (s.match(/\.[\w-]+|\[[^\]]+\]|(?<!:):(?!:)[\w-]+/g) || []).length;
  const c = (s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+/g, ' ').match(/(^|[\s>+~])([a-z][\w-]*)/gi) || []).length +
    (s.match(/::[\w-]+/g) || []).length;
  return [a, b, c];
}
const cmp = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);

function lastCompound(sel) {
  const parts = sel.trim().split(/\s*[\s>+~]\s*/).filter(Boolean);
  return (parts[parts.length - 1] || '').replace(/::?[\w-]+(\([^)]*\))?/g, '');
}
function classesOf(compound) {
  return (compound.match(/\.[\w-]+/g) || []).sort();
}
/** ¿El selector "fuerte" apunta (aprox.) al mismo elemento? Mismo compuesto final y
 *  los ancestros del débil aparecen en el fuerte. */
function sameTarget(weak, strong) {
  const lw = classesOf(lastCompound(weak));
  const ls = classesOf(lastCompound(strong));
  if (!lw.length || lw.join() !== ls.join()) return false;
  const ancW = weak.match(/\.[\w-]+/g) || [];
  return ancW.every((c) => strong.includes(c));
}

/* ───────── checks ───────── */
const findings = [];
const add = (level, rule, file, line, msg) => findings.push({ level, rule, file: path.relative(root, file), line, msg });

const styleFiles = walk(SRC, ['.scss', '.css']);
const globalStyles = new Set(
  ['styles/admin-crud.scss', 'styles/admin-data-panel.scss', 'styles/admin-page-layout.scss', 'styles/admin-table.scss',
    'styles/admin-dense-list.scss', 'styles/admin-dialog.scss', 'styles/inventario-dialog.scss', 'app/portal/portal-shell.scss']
    .map((p) => path.join(SRC, p)),
);

const parsed = styleFiles.map((f) => {
  const src = stripComments(fs.readFileSync(f, 'utf8'));
  return { file: f, src, rules: parse(src) };
});

// 1) media-override-pierde — comparar contra el mismo archivo y contra los globales
const globalRules = parsed.filter((p) => globalStyles.has(p.file)).flatMap((p) => p.rules.map((r) => ({ ...r, file: p.file })));
for (const p of parsed) {
  const pool = [...p.rules.map((r) => ({ ...r, file: p.file })), ...(globalStyles.has(p.file) ? [] : globalRules)];
  for (const r of p.rules) {
    if (!r.media || r.media.max == null || r.media.max > MOBILE_MAX) continue;
    for (const d of r.decls) {
      if (!d.important) continue;
      for (const sel of r.selectors) {
        const mine = specificity(sel);
        // Si alguna otra variante de la misma regla ya es tan fuerte, no hay problema
        const best = r.selectors.map(specificity).sort(cmp).pop();
        for (const o of pool) {
          if (o.media && o.media.max != null && o.media.max <= MOBILE_MAX) continue; // otra regla móvil
          if (o.media && o.media.min != null) continue; // regla solo de escritorio: no compite en celular
          const od = o.decls.find((x) => x.prop === d.prop && x.important);
          if (!od || od.value === d.value) continue;
          const strong = o.selectors.find((s) => sameTarget(sel, s) && cmp(specificity(s), best) > 0);
          // ¿Otra regla de celular (activa a 375px) le gana a «strong»? Entonces ya está resuelto.
          const resolved = strong && pool.some((f) =>
            f.media && f.media.max != null && f.media.max >= 375 && f.media.max <= MOBILE_MAX &&
            (f.media.min == null || f.media.min <= 375) &&
            f.decls.some((x) => x.prop === d.prop && x.important) &&
            f.selectors.some((s2) => sameTarget(strong, s2) && cmp(specificity(s2), specificity(strong)) >= 0));
          if (strong && !resolved) {
            add('ERROR', 'media-override-pierde', p.file, r.line,
              `«${sel}» { ${d.prop}: ${d.value} } dentro de ${r.media.text} nunca aplica: ` +
              `«${strong}» (${path.relative(root, o.file)}:${o.line}) es más específico ` +
              `[${specificity(strong)}] vs [${mine}] → en celular queda «${od.value}».`);
          }
        }
      }
    }
  }
}

for (const p of parsed) {
  for (const r of p.rules) {
    for (const d of r.decls) {
      // 2) dialog-80vw
      if (d.prop === 'width' && d.value.includes('--mat-dialog-container-max-width')) {
        const fixed = p.rules.some((o) => o !== r && o.media && o.media.max != null && o.media.max <= 640 &&
          o.selectors.some((s) => r.selectors.includes(s)) && o.decls.some((x) => x.prop === 'width' && !x.value.includes('var(')));
        if (!fixed) add('ERROR', 'dialog-80vw', p.file, r.line,
          `width usa var(--mat-dialog-container-max-width) (80vw en Material) sin override ≤640px → diálogo de 300px en celular.`);
      }
      // 3) tabla-ancha-movil
      if (d.prop === 'min-width' && r.media && r.media.max != null && r.media.max <= 640) {
        const px = parseInt(d.value, 10);
        if (px > 600) add('AVISO', 'tabla-ancha-movil', p.file, r.line,
          `min-width: ${d.value} dentro de ${r.media.text} → el usuario desliza de lado (${r.selectors[0]}).`);
      }
    }
    // 4) vh-sin-dvh
    for (const prop of ['height', 'max-height', 'min-height']) {
      const vals = r.decls.filter((d) => d.prop === prop).map((d) => d.value);
      if (vals.some((v) => /\b100vh\b/.test(v)) && !vals.some((v) => /dvh/.test(v))) {
        add('AVISO', 'vh-sin-dvh', p.file, r.line, `${prop}: 100vh sin respaldo 100dvh (${r.selectors[0]}).`);
      }
    }
  }
}

// 5) dblclick-sin-tap
for (const f of walk(path.join(SRC, 'app'), ['.html'])) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /<([a-z][\w-]*)\b([^>]*?\(dblclick\)=("[^"]*")[^>]*)>/gis;
  let m;
  while ((m = re.exec(src))) {
    const attrs = m[2];
    if (/stopPropagation\(\)\s*"$/.test(m[3])) continue; // solo corta burbujeo
    if (/\(click\)=/.test(attrs) || /\(tap\)|\(pointerup\)/.test(attrs)) continue;
    add('AVISO', 'dblclick-sin-tap', f, lineAt(src, m.index),
      `<${m[1]} (dblclick)=${m[3]}> sin (click): en celular no se puede abrir el detalle tocando.`);
  }
}

/* ───────── línea base: solo fallan los errores NUEVOS ───────── */
const BASELINE = path.join(root, 'scripts', 'mobile-css-baseline.json');
const keyOf = (f) => `${f.rule}|${f.file}|${f.msg.replace(/\(src\/[^)]*:\d+\)/g, '').replace(/:\d+/g, '')}`;
if (process.argv.includes('--update-baseline')) {
  const keys = findings.filter((f) => f.level === 'ERROR').map(keyOf).sort();
  fs.writeFileSync(BASELINE, JSON.stringify({ nota: 'Errores móviles conocidos. Bajar esta lista, nunca subirla.', errores: keys }, null, 2) + '\n');
  console.log(`Línea base guardada: ${keys.length} error(es) conocidos → scripts/mobile-css-baseline.json`);
  process.exit(0);
}
let known = new Set();
if (process.argv.includes('--baseline') && fs.existsSync(BASELINE)) {
  known = new Set(JSON.parse(fs.readFileSync(BASELINE, 'utf8')).errores);
  for (const f of findings) if (f.level === 'ERROR' && known.has(keyOf(f))) f.level = 'CONOCIDO';
}

/* ───────── salida ───────── */
const errors = findings.filter((f) => f.level === 'ERROR');
const conocidos = findings.filter((f) => f.level === 'CONOCIDO').length;
if (known.size && conocidos < known.size) {
  console.log(`🎉 Se corrigieron ${known.size - conocidos} error(es) de la línea base. Corre: npm run check:mobile -- --update-baseline`);
}
if (asJson) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  const byRule = {};
  for (const f of findings) (byRule[f.rule] ||= []).push(f);
  for (const [rule, list] of Object.entries(byRule)) {
    const nuevos = list.filter((f) => f.level !== 'CONOCIDO');
    if (!nuevos.length) {
      console.log(`\n· ${rule}: ${list.length} conocido(s) en línea base`);
      continue;
    }
    console.log(`\n${nuevos[0].level === 'ERROR' ? '❌' : '⚠️ '} ${rule} (${nuevos.length})`);
    for (const f of nuevos) console.log(`   ${f.file}:${f.line}  ${f.msg}`);
  }
  const imp = parsed.reduce((n, p) => n + (p.src.match(/!important/g) || []).length, 0);
  const avisos = findings.filter((f) => f.level === 'AVISO').length;
  console.log(`\nResumen: ${errors.length} error(es) nuevos, ${conocidos} conocido(s), ${avisos} aviso(s). !important en estilos: ${imp}.`);
  if (!findings.length) console.log('OK: sin fallos móviles detectables estáticamente.');
}
process.exit(errors.length ? 1 : 0);
