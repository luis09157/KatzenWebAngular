#!/usr/bin/env node
/**
 * Spec 064 — convierte salida isql SET LIST ON (CP1252) a pdv-extract.json UTF-8.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = process.argv[2] || join(root, 'tmp/pdv-eleventa/productos-list.txt');
const dest = process.argv[3] || join(root, 'tmp/pdv-eleventa/pdv-extract.json');

const raw = readFileSync(src);
const text = raw.toString('latin1');

function parseListOn(body) {
  const records = [];
  let current = {};
  const flush = () => {
    if (Object.keys(current).length) {
      records.push(current);
      current = {};
    }
  };
  for (const line of body.split(/\r?\n/)) {
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.length < 3) continue;
    const name = line.slice(0, 32).trim();
    const value = line.length > 32 ? line.slice(32).trim() : '';
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) continue;
    current[name] = value;
  }
  flush();
  return records;
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

const rows = parseListOn(text).filter((r) => r.CODIGO);
const productos = rows.map((r) => ({
  codigo: r.CODIGO,
  descripcion: r.DESCRIPCION || '',
  tventa: r.TVENTA || '',
  pcosto: r.PCOSTO === '' || r.PCOSTO == null ? null : Number(r.PCOSTO),
  pventa: r.PVENTA === '' || r.PVENTA == null ? null : Number(r.PVENTA),
  pfinal: r.PVENTA === '' || r.PVENTA == null ? null : Number(r.PVENTA),
  mayoreo: r.MAYOREO === '' || r.MAYOREO == null ? null : Number(r.MAYOREO),
  dept: r.DEPT === '' || r.DEPT == null ? null : Number(r.DEPT),
  departamento: DEPTOS[Number(r.DEPT)] || '',
  existencia: r.DINVENTARIO === '' || r.DINVENTARIO == null ? 0 : Number(r.DINVENTARIO),
  invMinimo: r.DINVMINIMO === '' || r.DINVMINIMO == null ? null : Number(r.DINVMINIMO),
  invMaximo: r.DINVMAXIMO === '' || r.DINVMAXIMO == null ? null : Number(r.DINVMAXIMO),
  porcentajeGanancia: r.PORCENTAJE_GANANCIA === '' ? null : Number(r.PORCENTAJE_GANANCIA),
  componentes: r.COMPONENTES || '',
  impuestos: r.IMPUESTOS || ''
}));

mkdirSync(dirname(dest), { recursive: true });
const payload = {
  origen: 'eleventa',
  extraidoEn: new Date().toISOString(),
  esquema: {
    pkProductos: 'CODIGO',
    precioCajero: 'PVENTA',
    pfinal: 'no existe — se usa PVENTA',
    stock: 'DINVENTARIO',
    ivaCatalogo: { nombre: 'IVA', porcentaje: 16, activo: false, defecto: false },
    configImpuestosUsa: 0
  },
  conteos: {
    productos: productos.length
  },
  productos
};
writeFileSync(dest, JSON.stringify(payload, null, 2), 'utf8');
console.log('OK', productos.length, 'productos →', dest);
