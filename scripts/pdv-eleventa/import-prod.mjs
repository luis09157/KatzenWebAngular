#!/usr/bin/env node
/**
 * Spec 064 — import catálogo Eleventa a producción katzen-a0e3e.
 *
 * SOLO escribe si:
 *   CONFIRM_PROD=katzen-a0e3e (guard compartido scripts/lib/guard-prod.mjs)
 *   PDV_RTDB_TARGET=prod AND PDV_CONFIRM_PROD=LUIS
 *   databaseURL es katzen-a0e3e
 *   deny-list (nunca Katzen/Producto ni Katzen/Productos)
 *
 *   CONFIRM_PROD=katzen-a0e3e PDV_RTDB_TARGET=prod PDV_CONFIRM_PROD=LUIS node scripts/pdv-eleventa/import-prod.mjs
 *
 * Backup ANTES de writes → tmp/pdv-eleventa/backup-prod-*.json (gitignored).
 * Upsert por codigo_barras. No borra E2E ni legacy.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertProdConfirmed, PROD_PROJECT_ID, PROD_DATABASE_URL } from '../lib/guard-prod.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(root, 'tmp/pdv-eleventa');
const extractPath = join(outDir, 'pdv-extract.json');
const PROD_PROJECT = PROD_PROJECT_ID;
const PROD_DB_URL = PROD_DATABASE_URL;

const DENY = [
  /^Katzen\/Producto(\/|$)/,
  /^Katzen\/Productos(\/|$)/,
  /FACTURACION_CERTIFICADOS/i,
  /(^|\/)CSD(\/|$)/i
];
const ALLOW = [/^Katzen\/Inventario\//, /^Katzen\/ServiciosClinica/];

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

function abort(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function assertPath(path) {
  const p = String(path || '').replace(/^\/+/, '');
  if (DENY.some((re) => re.test(p)) || !ALLOW.some((re) => re.test(p))) {
    throw new Error(`Deny-list RTDB: ${p}`);
  }
}

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

function safeKey(c) {
  return String(c).replace(/[.#$\/\[\]]/g, '_');
}

function buildPayloads(rows, now) {
  const payloads = [];
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
  }
  return { payloads, porDestino };
}

// Guard compartido (scripts/lib/guard-prod.mjs): exige CONFIRM_PROD=katzen-a0e3e,
// valida projectId/databaseURL y aborta si hay variables de emulador activas.
assertProdConfirmed({ script: 'pdv-eleventa/import-prod', projectId: PROD_PROJECT, databaseURL: PROD_DB_URL });

const target = process.env.PDV_RTDB_TARGET || '';
if (target !== 'prod' || process.env.PDV_CONFIRM_PROD !== 'LUIS') {
  abort(
    'Abortado: producción exige PDV_RTDB_TARGET=prod y PDV_CONFIRM_PROD=LUIS.\n' +
      'Ejemplo: CONFIRM_PROD=katzen-a0e3e PDV_RTDB_TARGET=prod PDV_CONFIRM_PROD=LUIS node scripts/pdv-eleventa/import-prod.mjs'
  );
}

if (!existsSync(extractPath)) {
  abort(`No hay extracto: ${extractPath}\nCorre antes: bash scripts/pdv-eleventa/extract.sh`, 2);
}

const extract = JSON.parse(readFileSync(extractPath, 'utf8'));
const rows = extract.productos || [];
if (rows.length !== 685) {
  abort(`Gate extract: esperaba 685 filas, hay ${rows.length}`, 2);
}

const now = new Date().toISOString();
const { payloads, porDestino } = buildPayloads(rows, now);
if (payloads.length !== 685) {
  abort(`Gate payloads: esperaba 685, hay ${payloads.length}`, 2);
}

const paths = [
  'Katzen/Inventario/Productos',
  'Katzen/Inventario/PdvCodigoMap',
  'Katzen/Inventario/Movimientos',
  'Katzen/Inventario/PdvEnlacesBaco',
  'Katzen/ServiciosClinica'
];
paths.forEach(assertPath);

console.log('Extracto', rows.length, 'payloads', payloads.length, 'destinos', porDestino);

process.env.GOOGLE_CLOUD_PROJECT = PROD_PROJECT;
process.env.GCLOUD_PROJECT = PROD_PROJECT;

const { initializeApp, applicationDefault } = await import('firebase-admin/app');
const { getDatabase } = await import('firebase-admin/database');

if (!/katzen-a0e3e/i.test(PROD_DB_URL)) {
  abort('Abortado: databaseURL no es katzen-a0e3e.');
}

initializeApp({
  credential: applicationDefault(),
  projectId: PROD_PROJECT,
  databaseURL: PROD_DB_URL
});
const db = getDatabase();
const connectedUrl = db.app.options.databaseURL || '';
const connectedProject = db.app.options.projectId || '';
if (!/katzen-a0e3e/i.test(connectedUrl) || connectedProject !== PROD_PROJECT) {
  abort(`Abortado: conexión no es prod (${connectedProject} ${connectedUrl})`);
}
if (/127\.0\.0\.1|localhost|9000/i.test(connectedUrl)) {
  abort('Abortado: URL parece emulador.');
}

console.log('Conectado', connectedProject, connectedUrl);

mkdirSync(outDir, { recursive: true });
const stamp = now.replace(/[:.]/g, '-').slice(0, 19);
const backupPath = join(outDir, `backup-prod-inventario-${stamp}.json`);

console.log('Backup RTDB Katzen/Inventario + ServiciosClinica…');
const [invSnap, svcSnap] = await Promise.all([
  db.ref('Katzen/Inventario').once('value'),
  db.ref('Katzen/ServiciosClinica').once('value')
]);
const inventarioBefore = invSnap.val();
const serviciosBefore = svcSnap.val();
const productosBefore = (inventarioBefore && inventarioBefore.Productos) || {};
const nProductosBefore = Object.keys(productosBefore).length;
const nServiciosBefore = serviciosBefore && typeof serviciosBefore === 'object' ? Object.keys(serviciosBefore).length : 0;

writeFileSync(
  backupPath,
  JSON.stringify(
    {
      backedUpAt: now,
      projectId: PROD_PROJECT,
      databaseURL: PROD_DB_URL,
      paths: ['Katzen/Inventario', 'Katzen/ServiciosClinica'],
      counts: { productos: nProductosBefore, serviciosClinica: nServiciosBefore },
      Inventario: inventarioBefore,
      ServiciosClinica: serviciosBefore
    },
    null,
    2
  )
);
console.log('Backup →', backupPath, 'productos previos', nProductosBefore, 'servicios', nServiciosBefore);

const existingByCodigo = new Map();
for (const [id, p] of Object.entries(productosBefore)) {
  if (!p || typeof p !== 'object') continue;
  const code = codigoNorm(p.codigo_barras || p.pdvCodigo);
  if (!code) continue;
  if (!existingByCodigo.has(code)) existingByCodigo.set(code, { id, raw: p });
}

const existingServiciosByPdv = new Map();
for (const [id, s] of Object.entries(serviciosBefore || {})) {
  if (!s || typeof s !== 'object') continue;
  const code = codigoNorm(s.pdvCodigo);
  if (code) existingServiciosByPdv.set(code, id);
}

const updates = {};
const idMap = {};
let nUpsert = 0;
let nInsert = 0;
let nMovimientos = 0;
let nServicios = 0;
let nBaco = 0;

for (const item of payloads) {
  const prev = existingByCodigo.get(item.codigo);
  const key = prev ? prev.id : db.ref('Katzen/Inventario/Productos').push().key;
  if (!key) throw new Error(`Sin key para ${item.codigo}`);
  idMap[item.codigo] = key;
  const prodPath = `Katzen/Inventario/Productos/${key}`;
  assertPath(prodPath);
  if (prev) {
    nUpsert += 1;
    const merged = {
      ...prev.raw,
      ...item.producto,
      id: key,
      created_at: prev.raw.created_at || now,
      imagen_url: prev.raw.imagen_url || item.producto.imagen_url || undefined
    };
    if (!merged.imagen_url) delete merged.imagen_url;
    updates[prodPath] = merged;
  } else {
    nInsert += 1;
    updates[prodPath] = { ...item.producto, id: key };
  }
  const mapPath = `Katzen/Inventario/PdvCodigoMap/${safeKey(item.codigo)}`;
  assertPath(mapPath);
  updates[mapPath] = key;
  if (item.stock > 0 && item.visiblePos) {
    const mk = db.ref('Katzen/Inventario/Movimientos').push().key;
    const movPath = `Katzen/Inventario/Movimientos/${mk}`;
    assertPath(movPath);
    updates[movPath] = {
      producto_id: key,
      tipo: 'ajuste',
      cantidad: item.stock,
      motivo: `Migración eleventa ${now.slice(0, 10)}`,
      origenPdv: 'eleventa',
      created_at: now
    };
    nMovimientos += 1;
  }
  if (item.destino === 'banho') {
    const bacoPath = `Katzen/Inventario/PdvEnlacesBaco/${safeKey(item.codigo)}`;
    assertPath(bacoPath);
    updates[bacoPath] = {
      productoId: key,
      pdvCodigo: item.codigo,
      precio_venta: item.producto.precio_venta,
      enlazarTarifa022: true,
      updated_at: now
    };
    nBaco += 1;
  }
  if (item.destino === 'examen' || item.destino === 'servicio') {
    const sk = existingServiciosByPdv.get(item.codigo) || db.ref('Katzen/ServiciosClinica').push().key;
    const svcPath = `Katzen/ServiciosClinica/${sk}`;
    assertPath(svcPath);
    updates[svcPath] = {
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
      pdvCodigo: item.codigo,
      id: sk
    };
    nServicios += 1;
  }
}

Object.keys(updates).forEach(assertPath);
const nKeys = Object.keys(updates).length;
console.log(
  `Escribiendo ${nKeys} paths (${nInsert} altas, ${nUpsert} upsert, ${nMovimientos} ajustes, ${nBaco} BACO, ${nServicios} servicios)…`
);

await db.ref().update(updates);

const snapAfter = await db.ref('Katzen/Inventario/Productos').once('value');
const productosAfter = snapAfter.val() || {};
const allAfter = Object.entries(productosAfter);
const eleventaAfter = allAfter.filter(([, p]) => p && p.origenPdv === 'eleventa');
const byCodigo = new Map(eleventaAfter.map(([, p]) => [codigoNorm(p.codigo_barras), p]));
const escritos = payloads.length;
const leidosEleventa = eleventaAfter.length;
const gate = escritos === 685 && leidosEleventa === 685;

function sampleOf(code) {
  const p = byCodigo.get(code);
  const raw = rows.find((r) => codigoNorm(r.codigo) === code);
  if (!p || !raw) return { code, ok: false, reason: !raw ? 'no extract' : 'no prod' };
  const ele = raw.pfinal ?? raw.pventa;
  const visiblePos = p.visiblePos !== false && p.activo !== false;
  const esperadoVenta = visiblePos || p.visiblePos ? round2(round2(ele) * 1.16) : round2(ele);
  // uso interno: activo false, precio sin *1.16; samples V003/BACO/KTZ son visibles
  const ventaOk = p.precio_venta === esperadoVenta;
  return {
    code,
    nombre: p.nombre,
    precio_venta: p.precio_venta,
    esperadoVenta,
    ventaOk,
    stock_actual: p.stock_actual,
    activo: p.activo,
    visiblePos: p.visiblePos,
    esKit: p.esKit,
    kitComponentes: p.kitComponentes || null,
    extract: { pventa: raw.pventa, existencia: raw.existencia, componentes: raw.componentes }
  };
}

const samples = {
  V003: sampleOf('V003'),
  BACO001: sampleOf('BACO001'),
  KTZ056: sampleOf('KTZ056')
};
const sampleOk =
  samples.V003.ventaOk &&
  samples.V003.precio_venta === 290 &&
  samples.V003.stock_actual === 30 &&
  samples.BACO001.ventaOk &&
  samples.BACO001.precio_venta === 232 &&
  samples.BACO001.stock_actual === 0 &&
  samples.KTZ056.ventaOk &&
  samples.KTZ056.esKit === true &&
  Array.isArray(samples.KTZ056.kitComponentes) &&
  samples.KTZ056.kitComponentes.length === 3;

const nVisibles = eleventaAfter.filter(([, p]) => p.activo !== false).length;
const nInternos = eleventaAfter.filter(([, p]) => p.activo === false).length;
const nTotalProd = allAfter.length;
const nActivosListado = allAfter.filter(([, p]) => p && p.activo !== false).length;

const result = {
  projectId: PROD_PROJECT,
  databaseURL: PROD_DB_URL,
  backupPath,
  nExtract: rows.length,
  escritos,
  nInsert,
  nUpsert,
  leidosEleventa,
  nTotalProd,
  nActivosListado,
  nVisibles,
  nInternos,
  nMovimientos,
  nBaco,
  nServicios,
  porDestino,
  gate,
  sampleOk,
  samples,
  url: 'https://katzen-a0e3e.web.app/admin/inventario/productos',
  hostingDeploy: false
};

const resultPath = join(outDir, 'import-prod-result.json');
writeFileSync(join(outDir, 'id-map-prod.json'), JSON.stringify(idMap, null, 2));
writeFileSync(resultPath, JSON.stringify(result, null, 2));

console.log('Prod escritos', escritos, 'eleventa leídos', leidosEleventa, gate ? 'GATE N=N OK' : 'GATE FAIL');
console.log('Total Productos en RTDB', nTotalProd, '| listado activo', nActivosListado, '| internos eleventa', nInternos);
console.log('Sample', sampleOk ? 'OK' : 'FAIL', JSON.stringify(samples, null, 2));
console.log('Resultado →', resultPath);
console.log('Ver:', result.url);

if (!gate || !sampleOk) process.exit(2);
process.exit(0);
