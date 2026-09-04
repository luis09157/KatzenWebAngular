/**
 * Spec 064 — reglas de import anaquel (ola A).
 * IVA 16% en todo lo vendible. Uso interno no va a caja.
 * Stock negativo → 0. Servicios/baños/exámenes no cargan existencia.
 */

import { CategoriaProducto, Producto, UnidadMedida } from '../../shared/inventario.models';
import { nombreDepartamentoPdv } from './pdv-deptos.util';
import { mapearPreciosPdvAKatzen, PreciosPdvMapeados, roundMoney2 } from './pdv-iva-map.util';
import { FilaPdvExtract } from './pdv-dry-run.util';
import {
  clasificarSkuPdv,
  ClasificacionPdvSku,
  DestinoPdvSku,
  normalizarCodigoPdv
} from './pdv-sku-clasificacion.util';

const DESTINOS_SIN_STOCK: DestinoPdvSku[] = ['banho', 'servicio', 'examen'];

export function esDestinoSinStockPdv(destino: DestinoPdvSku): boolean {
  return DESTINOS_SIN_STOCK.includes(destino);
}

export function stockImportadoPdv(
  existencia: unknown,
  destino: DestinoPdvSku
): { stock: number; stockOrigen: number; clampNegativo: boolean; forzarCero: boolean } {
  const raw = Number(existencia);
  const stockOrigen = Number.isFinite(raw) ? raw : 0;
  const clampNegativo = stockOrigen < 0;
  const forzarCero = esDestinoSinStockPdv(destino);
  const stock = forzarCero ? 0 : Math.max(0, stockOrigen);
  return { stock, stockOrigen, clampNegativo, forzarCero };
}

export function visibleEnPosPdv(destino: DestinoPdvSku): boolean {
  return destino !== 'uso_interno';
}

export function pathRtdbPermitidoPdv(path: string): boolean {
  const p = String(path || '').replace(/^\/+/, '');
  if (p === 'Katzen/Producto' || p.startsWith('Katzen/Producto/')) return false;
  if (p === 'Katzen/Productos' || p.startsWith('Katzen/Productos/')) return false;
  return p.startsWith('Katzen/Inventario/') || p.startsWith('Katzen/ServiciosClinica');
}

export function assertPathsImportPdv(paths: string[]): void {
  const mal = (paths || []).filter((p) => !pathRtdbPermitidoPdv(p));
  if (mal.length) {
    throw new Error(`Deny-list RTDB (nodos móvil): ${mal.join(', ')}`);
  }
}

export interface FilaPdvEnriquecida extends FilaPdvExtract {
  departamento: string;
}

export function enriquecerFilaExtractPdv(row: FilaPdvExtract & { dept?: unknown }): FilaPdvEnriquecida {
  return {
    ...row,
    departamento: nombreDepartamentoPdv(row.dept, row.departamento)
  };
}

export interface PayloadProductoPdv {
  path: 'Katzen/Inventario/Productos';
  codigo: string;
  destino: DestinoPdvSku;
  clasificacion: ClasificacionPdvSku;
  precios: PreciosPdvMapeados;
  stock: number;
  stockOrigen: number;
  clampNegativo: boolean;
  forzarCeroStock: boolean;
  visiblePos: boolean;
  costoGeNetaVendible: boolean;
  producto: Omit<Producto, 'id'>;
}

function unidadDesdeTventa(tventa: unknown): UnidadMedida {
  return String(tventa || 'U').toUpperCase() === 'G' ? 'gr' : 'unidad';
}

export function mapearFilaImportPdv(
  row: FilaPdvExtract & { dept?: unknown; tventa?: unknown; invMinimo?: unknown; invMaximo?: unknown }
): PayloadProductoPdv {
  const enriched = enriquecerFilaExtractPdv(row);
  const codigo = normalizarCodigoPdv(enriched.codigo);
  const clas = clasificarSkuPdv(enriched);
  const visiblePos = visibleEnPosPdv(clas.destino);
  const aplicarIva16 = visiblePos;
  const precios = mapearPreciosPdvAKatzen({
    pfinal: enriched.pfinal,
    pventa: enriched.pventa,
    pcosto: enriched.pcosto,
    aplicarIva16
  });
  const st = stockImportadoPdv(enriched.existencia, clas.destino);
  const categoria: CategoriaProducto = clas.categoria || 'accesorio';
  const compra = precios.precio_compra ?? 0;
  const venta = precios.precio_venta ?? 0;
  const margen =
    compra > 0 ? roundMoney2(((venta - compra) / compra) * 100) : venta > 0 ? 100 : 0;
  const now = '1970-01-01T00:00:00.000Z';
  const costoGeNetaVendible =
    visiblePos &&
    precios.precio_compra != null &&
    precios.precio_neto != null &&
    precios.precio_compra >= precios.precio_neto;

  const producto: Omit<Producto, 'id'> = {
    codigo_barras: codigo,
    nombre: String(enriched.descripcion || codigo).trim(),
    descripcion: String(enriched.descripcion || '').trim(),
    categoria,
    subcategoria: clas.subcategoria || enriched.departamento || '',
    marca: '',
    presentacion: '',
    unidad_medida: unidadDesdeTventa(row.tventa),
    stock_actual: st.stock,
    stock_minimo: Number.isFinite(Number(row.invMinimo)) ? Number(row.invMinimo) : 0,
    stock_maximo: Number.isFinite(Number(row.invMaximo)) ? Number(row.invMaximo) : 0,
    punto_reorden: 0,
    ubicacion_almacen: enriched.departamento || '',
    requiere_refrigeracion: clas.destino === 'vacuna',
    fecha_caducidad_alerta_dias: clas.destino === 'vacuna' ? 30 : 0,
    precio_compra: compra,
    precio_venta: venta,
    margen_ganancia: margen,
    iva_aplicable: aplicarIva16,
    tasa_iva: aplicarIva16 ? 16 : 0,
    proveedor_principal_id: '',
    proveedores_alternos: [],
    requiere_receta: clas.destino === 'vacuna' || categoria === 'medicamento',
    controlado: false,
    activo: visiblePos,
    visiblePos,
    created_at: now,
    updated_at: now,
    origenPdv: 'eleventa',
    pdvCodigo: codigo,
    esKit: clas.esKit,
    kitComponentes: clas.componentes.length ? clas.componentes : undefined
  };

  return {
    path: 'Katzen/Inventario/Productos',
    codigo,
    destino: clas.destino,
    clasificacion: clas,
    precios,
    stock: st.stock,
    stockOrigen: st.stockOrigen,
    clampNegativo: st.clampNegativo,
    forzarCeroStock: st.forzarCero,
    visiblePos,
    costoGeNetaVendible,
    producto
  };
}

export interface ReportesImportPdv {
  impactoIva: Array<{
    codigo: string;
    descripcion: string;
    destino: DestinoPdvSku;
    precio_eleventa: number | null;
    precio_web_con_iva: number | null;
    delta: number | null;
  }>;
  exclusionesPos: Array<{ codigo: string; descripcion: string; departamento: string; destino: DestinoPdvSku }>;
  stockImportadoCero: Array<{
    codigo: string;
    descripcion: string;
    destino: DestinoPdvSku;
    stockOrigen: number;
    motivo: string;
  }>;
  costoGeVendible: Array<{
    codigo: string;
    descripcion: string;
    departamento: string;
    pcosto: number | null;
    pventa: number | null;
  }>;
}

export interface ResultadoMapaImportPdv {
  payloads: PayloadProductoPdv[];
  porDestino: Record<DestinoPdvSku, number>;
  n: number;
  nVisiblesPos: number;
  valuacionCosto: number;
  valuacionVenta: number;
  reportes: ReportesImportPdv;
  paths: string[];
}

const DESTINOS: DestinoPdvSku[] = [
  'anaquel',
  'vacuna',
  'banho',
  'servicio',
  'examen',
  'kit',
  'uso_interno'
];

export function mapearExtractoImportPdv(
  rows: Array<FilaPdvExtract & { dept?: unknown; tventa?: unknown }>
): ResultadoMapaImportPdv {
  const payloads = (rows || []).map((row) => mapearFilaImportPdv(row));
  const porDestino = DESTINOS.reduce((acc, d) => {
    acc[d] = 0;
    return acc;
  }, {} as Record<DestinoPdvSku, number>);
  const reportes: ReportesImportPdv = {
    impactoIva: [],
    exclusionesPos: [],
    stockImportadoCero: [],
    costoGeVendible: []
  };

  let valuacionCosto = 0;
  let valuacionVenta = 0;
  let nVisiblesPos = 0;

  for (const p of payloads) {
    porDestino[p.destino] += 1;
    if (p.visiblePos) nVisiblesPos += 1;
    else {
      reportes.exclusionesPos.push({
        codigo: p.codigo,
        descripcion: p.producto.nombre,
        departamento: p.producto.ubicacion_almacen,
        destino: p.destino
      });
    }
    if (p.visiblePos) {
      reportes.impactoIva.push({
        codigo: p.codigo,
        descripcion: p.producto.nombre,
        destino: p.destino,
        precio_eleventa: p.precios.precio_eleventa_sin_iva,
        precio_web_con_iva: p.precios.precio_venta,
        delta: p.precios.delta_precio_cliente
      });
    }
    if (p.clampNegativo || p.forzarCeroStock) {
      reportes.stockImportadoCero.push({
        codigo: p.codigo,
        descripcion: p.producto.nombre,
        destino: p.destino,
        stockOrigen: p.stockOrigen,
        motivo: p.forzarCeroStock
          ? 'servicio/baño/examen no es existencia'
          : `stock PDV ${p.stockOrigen} → 0`
      });
    }
    if (p.costoGeNetaVendible) {
      reportes.costoGeVendible.push({
        codigo: p.codigo,
        descripcion: p.producto.nombre,
        departamento: p.producto.ubicacion_almacen,
        pcosto: p.precios.precio_compra,
        pventa: p.precios.precio_eleventa_sin_iva
      });
    }
    if (p.stock > 0 && p.visiblePos) {
      valuacionCosto += (p.precios.precio_compra || 0) * p.stock;
      valuacionVenta += (p.precios.precio_venta || 0) * p.stock;
    }
  }

  const paths = [
    'Katzen/Inventario/Productos',
    'Katzen/Inventario/PdvCodigoMap',
    'Katzen/Inventario/Movimientos',
    'Katzen/ServiciosClinica'
  ];
  assertPathsImportPdv(paths);

  return {
    payloads,
    porDestino,
    n: payloads.length,
    nVisiblesPos,
    valuacionCosto: roundMoney2(valuacionCosto),
    valuacionVenta: roundMoney2(valuacionVenta),
    reportes,
    paths
  };
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n') + '\n';
}
