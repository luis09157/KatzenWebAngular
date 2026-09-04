#!/usr/bin/env node
/**
 * Spec 064 — reportes + import anaquel.
 * NUNCA escribe a katzen-a0e3e. Default: emulador 127.0.0.1:9000.
 *
 *   node scripts/pdv-eleventa/import-emulator.mjs
 *   PDV_RTDB_WRITE=1  → escribe al emulador (si está arriba)
 *   PDV_RTDB_NAMESPACE → namespace RTDB del emulador. Default `katzen-a0e3e-default-rtdb`:
 *                        el mismo que lee `ng serve` con `useRtdbEmulator: true`
 *                        (databaseURL de environment.ts + emulador :9000). Cambiarlo solo
 *                        para importar a un namespace aislado (ej. `demo-katzen-pdv`).
 *   FIREBASE_DATABASE_EMULATOR_HOST → host local del emulador (default 127.0.0.1:9000).
 *   PDV_RTDB_TARGET=prod → aborta. Producción: scripts/pdv-eleventa/import-prod.mjs
 *   (PDV_RTDB_TARGET=prod PDV_CONFIRM_PROD=LUIS)
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const target = process.env.PDV_RTDB_TARGET || 'emulator';
const outDir = join(root, 'tmp/pdv-eleventa');
const extractPath = join(outDir, 'pdv-extract.json');

const DENY = [/^Katzen\/Producto(\/|$)/, /^Katzen\/Productos(\/|$)/];
const ALLOW = [/^Katzen\/Inventario\//, /^Katzen\/ServiciosClinica/];

function abortProd() {
  if (target === 'prod' && process.env.PDV_CONFIRM_PROD !== 'LUIS') {
    console.error('Abortado: producción requiere PDV_CONFIRM_PROD=LUIS.');
    process.exit(1);
  }
  if (target === 'prod') {
    console.error('Este script no escribe producción. Usa scripts/pdv-eleventa/import-prod.mjs. Abortado.');
    process.exit(1);
  }
}

function assertPath(path) {
  const p = String(path || '').replace(/^\/+/, '');
  if (DENY.some((re) => re.test(p)) || !ALLOW.some((re) => re.test(p))) {
    throw new Error(`Deny-list RTDB: ${p}`);
  }
}

const DEPTOS = {
  0: '- Sin Departamento -',
  2: 'Consultorio',
  3: 'Alimento',
  4: 'Medicamento (Eliminado 04/04/2024)',
  5: 'Petshop',
  6: 'Premios (Eliminado 02/08/2023)',
  7: 'Grooming',
  8: 'Paquetes',
  9: 'Exámenes de laborat. (Eliminado 04/04/2024)',
  10: 'USOINTERNO (Eliminado 01/04/2024)',
  11: 'Ropa',
  12: 'Farmacia',
  13: 'UsoInterno',
  14: 'Equipo'
};

function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function codigoNorm(c) {
  return String(c || '').trim().toUpperCase();
}

function round2(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function parseBom(raw) {
  const out = [];
  for (const part of String(raw || '').split(/[;,\n]/)) {
    const token = part.trim();
    if (!token) continue;
    const [cod, qty] = token.split('=');
    const codigo = codigoNorm(cod);
    const cantidad = qty == null ? 1 : Number(qty);
    if (!codigo || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    out.push({ codigo, cantidad });
  }
  return out;
}

function destinoDe(row) {
  const codigo = codigoNorm(row.codigo);
  const desc = String(row.descripcion || '').trim();
  const descN = norm(desc);
  const depto = norm(row.departamento || DEPTOS[row.dept] || '');
  const bom = parseBom(row.componentes);
  if (/^BACO\d+/.test(codigo) || descN.includes('bano')) return 'banho';
  if (
    /^EXAM/.test(codigo) ||
    descN.includes('examen') ||
    descN.includes('biometria') ||
    descN.includes('coproparasit') ||
    descN.includes('hematica') ||
    depto.includes('examen')
  ) {
    return 'examen';
  }
  if (
    descN.includes('domicilio') ||
    descN.includes('honorario') ||
    descN.includes('cirugia') ||
    descN.includes('anticipo') ||
    descN.includes('corte de unas')
  ) {
    return 'servicio';
  }
  if (
    depto.includes('usointerno') ||
    /^UI([A-Z0-9]|$)/.test(codigo) ||
    /^MI([A-Z0-9]|$)/.test(codigo) ||
    /^ui(\s|$)/.test(descN) ||
    /^mi(\s|$)/.test(descN) ||
    descN.includes('uso interno')
  ) {
    return 'uso_interno';
  }
  if (bom.length || /^paq\b/i.test(desc) || descN.includes('paquete')) return 'kit';
  if (/^VAC/.test(codigo) || /^V\d{3}$/.test(codigo) || descN.includes('vacuna')) return 'vacuna';
  return 'anaquel';
}

function categoriaDe(destino, depto) {
  const d = norm(depto);
  if (destino === 'banho') return 'peluqueria';
  if (destino === 'examen') return 'diagnostico';
  if (destino === 'vacuna' || destino === 'kit') return 'vacuna';
  if (d.includes('alimento')) return 'alimento';
  if (d.includes('farmacia') || d.includes('medicamento')) return 'medicamento';
  if (d.includes('grooming')) return 'peluqueria';
  return 'accesorio';
}

function toCsv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n') + '\n';
}

abortProd();

if (!existsSync(extractPath)) {
  console.error('No hay extracto:', extractPath);
  console.error('Corre antes: bash scripts/pdv-eleventa/extract.sh');
  process.exit(2);
}

const extract = JSON.parse(readFileSync(extractPath, 'utf8'));
const rows = extract.productos || [];
if (rows.length !== 685 && extract.conteos?.productos && rows.length !== extract.conteos.productos) {
  console.warn('Aviso: filas JSON ≠ conteos.productos', rows.length, extract.conteos.productos);
}

const now = new Date().toISOString();
const payloads = [];
const reportes = {
  impactoIva: [],
  exclusionesPos: [],
  stockImportadoCero: [],
  costoGeVendible: []
};
const porDestino = {
  anaquel: 0,
  vacuna: 0,
  banho: 0,
  servicio: 0,
  examen: 0,
  kit: 0,
  uso_interno: 0
};

for (const raw of rows) {
  const codigo = codigoNorm(raw.codigo);
  const departamento = String(raw.departamento || DEPTOS[raw.dept] || '').trim();
  const destino = destinoDe({ ...raw, departamento });
  const visiblePos = destino !== 'uso_interno';
  const sinStock = destino === 'banho' || destino === 'servicio' || destino === 'examen';
  const stockOrigen = Number(raw.existencia);
  const origen = Number.isFinite(stockOrigen) ? stockOrigen : 0;
  const stock = sinStock ? 0 : Math.max(0, origen);
  const ele = raw.pfinal ?? raw.pventa;
  const sinIva = ele == null || ele === '' ? null : round2(ele);
  const venta = sinIva == null ? 0 : visiblePos ? round2(sinIva * 1.16) : round2(sinIva);
  const compra = raw.pcosto == null || raw.pcosto === '' ? 0 : round2(raw.pcosto);
  const neto = visiblePos && venta ? round2(venta / 1.16) : venta;
  const bom = parseBom(raw.componentes);
  const categoria = categoriaDe(destino, departamento);
  porDestino[destino] = (porDestino[destino] || 0) + 1;

  const producto = {
    codigo_barras: codigo,
    nombre: String(raw.descripcion || codigo).trim(),
    descripcion: String(raw.descripcion || '').trim(),
    categoria,
    subcategoria: departamento,
    marca: '',
    presentacion: '',
    unidad_medida: 'unidad',
    stock_actual: stock,
    stock_minimo: Number(raw.invMinimo) || 0,
    stock_maximo: Number(raw.invMaximo) || 0,
    punto_reorden: 0,
    ubicacion_almacen: departamento,
    requiere_refrigeracion: destino === 'vacuna',
    fecha_caducidad_alerta_dias: destino === 'vacuna' ? 30 : 0,
    precio_compra: compra,
    precio_venta: venta,
    margen_ganancia: compra > 0 ? round2(((venta - compra) / compra) * 100) : 0,
    iva_aplicable: visiblePos,
    tasa_iva: visiblePos ? 16 : 0,
    proveedor_principal_id: '',
    proveedores_alternos: [],
    requiere_receta: destino === 'vacuna' || categoria === 'medicamento',
    controlado: false,
    activo: visiblePos,
    visiblePos,
    created_at: now,
    updated_at: now,
    origenPdv: 'eleventa',
    pdvCodigo: codigo,
    esKit: bom.length > 0 || destino === 'kit',
    kitComponentes: bom.length ? bom : null
  };

  payloads.push({ codigo, destino, visiblePos, stock, stockOrigen: origen, producto });

  if (!visiblePos) {
    reportes.exclusionesPos.push({
      codigo,
      descripcion: producto.nombre,
      departamento,
      destino
    });
  } else {
    reportes.impactoIva.push({
      codigo,
      descripcion: producto.nombre,
      destino,
      departamento,
      precio_eleventa: sinIva,
      precio_web_con_iva: venta,
      delta: sinIva == null ? null : round2(venta - sinIva)
    });
  }
  if (origen < 0 || sinStock) {
    reportes.stockImportadoCero.push({
      codigo,
      descripcion: producto.nombre,
      destino,
      stockOrigen: origen,
      motivo: sinStock ? 'servicio/baño/examen no es existencia' : `stock PDV ${origen} → 0`
    });
  }
  if (visiblePos && compra > 0 && neto != null && compra >= neto) {
    reportes.costoGeVendible.push({
      codigo,
      descripcion: producto.nombre,
      departamento,
      pcosto: compra,
      pventa: sinIva
    });
  }
}

let valuacionCosto = 0;
let valuacionVenta = 0;
for (const p of payloads) {
  if (p.visiblePos && p.stock > 0) {
    valuacionCosto += p.producto.precio_compra * p.stock;
    valuacionVenta += p.producto.precio_venta * p.stock;
  }
}

const paths = [
  'Katzen/Inventario/Productos',
  'Katzen/Inventario/PdvCodigoMap',
  'Katzen/Inventario/Movimientos',
  'Katzen/Inventario/PdvEnlacesBaco',
  'Katzen/ServiciosClinica'
];
paths.forEach(assertPath);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'reporte-impacto-iva.csv'), toCsv(reportes.impactoIva));
writeFileSync(join(outDir, 'reporte-exclusiones-pos.csv'), toCsv(reportes.exclusionesPos));
writeFileSync(join(outDir, 'reporte-stock-cero.csv'), toCsv(reportes.stockImportadoCero));
writeFileSync(join(outDir, 'reporte-costo-ge-vendible.csv'), toCsv(reportes.costoGeVendible));

const resumen = {
  target,
  extraidoEn: extract.extraidoEn || null,
  nExtract: rows.length,
  nPayloads: payloads.length,
  nVsN: rows.length === payloads.length,
  porDestino,
  nVisiblesPos: payloads.filter((p) => p.visiblePos).length,
  nExclusionesPos: reportes.exclusionesPos.length,
  nStockCero: reportes.stockImportadoCero.length,
  nCostoGeVendible: reportes.costoGeVendible.length,
  valuacionCosto: round2(valuacionCosto),
  valuacionVenta: round2(valuacionVenta),
  clientesPdv: 0,
  writeProd: false,
  paths
};
writeFileSync(join(outDir, 'import-resumen.json'), JSON.stringify(resumen, null, 2));
writeFileSync(
  join(outDir, 'import-payload.json'),
  JSON.stringify(
    {
      n: payloads.length,
      productos: payloads.map((p) => p.producto)
    },
    null,
    2
  )
);

console.log('Extracto', rows.length, '→ payloads', payloads.length, resumen.nVsN ? 'N=N OK' : 'N≠N');
console.log('Destinos', porDestino);
console.log('Visibles POS', resumen.nVisiblesPos, '| exclusiones', resumen.nExclusionesPos);
console.log('Valuación visibles con stock  costo', resumen.valuacionCosto, 'venta', resumen.valuacionVenta);
console.log('CSV → tmp/pdv-eleventa/reporte-*.csv (gitignored)');

const wantWrite = process.env.PDV_RTDB_WRITE === '1';
if (!wantWrite) {
  console.log('Sin escritura RTDB (payload listo). Para emulador: PDV_RTDB_WRITE=1 npm run pdv:import-emulator');
  process.exit(resumen.nVsN ? 0 : 2);
}

const { initializeApp } = await import('firebase-admin/app');
const { getDatabase } = await import('firebase-admin/database');

process.env.FIREBASE_DATABASE_EMULATOR_HOST =
  process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000';
const emuHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
// Guard anti-prod: el host DEBE ser un emulador local; cualquier dominio remoto (firebaseio.com,
// katzen-a0e3e…) o un proyecto GCP de prod en el entorno aborta antes de inicializar el SDK.
const LOCAL_HOST_RE = /^(127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\])(:\d+)?$/i;
if (!LOCAL_HOST_RE.test(emuHost)) {
  console.error(`Abortado: FIREBASE_DATABASE_EMULATOR_HOST="${emuHost}" no es un emulador local (127.0.0.1/localhost).`);
  process.exit(1);
}
if (
  /katzen-a0e3e/i.test(emuHost) ||
  /katzen-a0e3e/i.test(process.env.GOOGLE_CLOUD_PROJECT || '') ||
  /katzen-a0e3e/i.test(process.env.GCLOUD_PROJECT || '')
) {
  console.error('Abortado: host/proyecto parece producción.');
  process.exit(1);
}

// projectId solo identifica la app de firebase-admin (credencial fake del emulador); NO define
// el namespace. El namespace viaja en `?ns=` y debe coincidir con el que lee la app Angular:
// environment.ts → databaseURL katzen-a0e3e-default-rtdb + useEmulator(127.0.0.1:9000).
const projectId = process.env.GCLOUD_PROJECT || 'demo-katzen-pdv';
const namespace = process.env.PDV_RTDB_NAMESPACE || 'katzen-a0e3e-default-rtdb';
if (!/^[a-z0-9-]+$/i.test(namespace)) {
  console.error(`Abortado: PDV_RTDB_NAMESPACE="${namespace}" inválido (solo letras, números y guiones).`);
  process.exit(1);
}
const databaseURL = `http://${emuHost}?ns=${namespace}`;
initializeApp({ projectId, databaseURL });
const db = getDatabase();
console.log('Emulador RTDB', emuHost, '| namespace', namespace);

async function pingEmu() {
  try {
    await fetch(`http://${emuHost}/.json`);
    return true;
  } catch {
    return false;
  }
}

if (!(await pingEmu())) {
  console.error('Emulador RTDB no responde en', emuHost);
  console.error('Arranca: npm run emulators   (scripts/emulators-start.mjs → auth + database, proyecto de .firebaserc)');
  process.exit(2);
}

const rootRef = db.ref();
const updates = {};
const idMap = {};
const safeKey = (c) => String(c).replace(/[.#$\/\[\]]/g, '_');

for (const item of payloads) {
  const key = db.ref('Katzen/Inventario/Productos').push().key;
  idMap[item.codigo] = key;
  const prodPath = `Katzen/Inventario/Productos/${key}`;
  assertPath(prodPath);
  updates[prodPath] = { ...item.producto, id: key };
  updates[`Katzen/Inventario/PdvCodigoMap/${safeKey(item.codigo)}`] = key;
  if (item.stock > 0 && item.visiblePos) {
    const mk = db.ref('Katzen/Inventario/Movimientos').push().key;
    updates[`Katzen/Inventario/Movimientos/${mk}`] = {
      producto_id: key,
      tipo: 'ajuste',
      cantidad: item.stock,
      motivo: `Migración eleventa ${now.slice(0, 10)}`,
      origenPdv: 'eleventa',
      created_at: now
    };
  }
  if (item.destino === 'banho') {
    updates[`Katzen/Inventario/PdvEnlacesBaco/${safeKey(item.codigo)}`] = {
      productoId: key,
      pdvCodigo: item.codigo,
      precio_venta: item.producto.precio_venta,
      enlazarTarifa022: true,
      updated_at: now
    };
  }
  if (item.destino === 'examen' || item.destino === 'servicio') {
    const sk = db.ref('Katzen/ServiciosClinica').push().key;
    updates[`Katzen/ServiciosClinica/${sk}`] = {
      nombre: item.producto.nombre,
      tipo: item.destino === 'examen' ? 'diagnostico' : /domicilio/i.test(item.producto.nombre)
        ? 'domicilio'
        : 'consulta',
      precio_venta: item.producto.precio_venta,
      precio_costo: item.producto.precio_compra,
      aplicaIva: true,
      tasaIva: 16,
      activo: true,
      notas: `pdvCodigo=${item.codigo}`,
      created_at: now,
      origenPdv: 'eleventa',
      pdvCodigo: item.codigo
    };
  }
}
Object.keys(updates).forEach(assertPath);
await rootRef.update(updates);
const escritos = payloads.length;

const snap = await db.ref('Katzen/Inventario/Productos').once('value');
const leidos = Object.keys(snap.val() || {}).length;
const gate = escritos === payloads.length && leidos === payloads.length;
writeFileSync(join(outDir, 'id-map.json'), JSON.stringify(idMap, null, 2));
writeFileSync(
  join(outDir, 'import-emulator-result.json'),
  JSON.stringify({ emuHost, projectId, namespace, escritos, leidos, gate, nExtract: rows.length }, null, 2)
);
console.log('Emulador', namespace, 'escritos', escritos, 'leídos', leidos, gate ? 'GATE N=N OK' : 'GATE FAIL');
process.exit(gate ? 0 : 2);
