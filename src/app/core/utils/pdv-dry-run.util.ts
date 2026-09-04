/**
 * Spec 064 fase 2 — dry-run sobre un extract (o samples) sin tocar RTDB.
 * Reporte de excepciones: duplicados, costo ≥ neta, IVA, kits huérfanos, clasificación.
 */

import { mapearPreciosPdvAKatzen } from './pdv-iva-map.util';
import {
  clasificarSkuPdv,
  DestinoPdvSku,
  normalizarCodigoPdv
} from './pdv-sku-clasificacion.util';

export interface FilaPdvExtract {
  pdvId?: number | null;
  codigo?: string | null;
  descripcion?: string | null;
  departamento?: string | null;
  pcosto?: unknown;
  pventa?: unknown;
  pfinal?: unknown;
  existencia?: unknown;
  componentes?: string | null;
  eliminado?: boolean;
}

export type TipoExcepcionPdv =
  | 'duplicado_codigo'
  | 'costo_ge_neta'
  | 'sin_precio'
  | 'stock_negativo'
  | 'kit_huerfano'
  | 'iva_vs_exento_sugerido'
  | 'sin_nombre'
  | 'sin_codigo';

export interface ExcepcionPdv {
  tipo: TipoExcepcionPdv;
  codigo: string;
  detalle: string;
}

export interface DryRunPdvResultado {
  totalFilas: number;
  porDestino: Record<DestinoPdvSku, number>;
  excepciones: ExcepcionPdv[];
  idsCodigos: string[];
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

export function dryRunExtractPdv(rows: FilaPdvExtract[] | null | undefined): DryRunPdvResultado {
  const list = rows || [];
  const porDestino = DESTINOS.reduce((acc, d) => {
    acc[d] = 0;
    return acc;
  }, {} as Record<DestinoPdvSku, number>);
  const excepciones: ExcepcionPdv[] = [];
  const seen = new Map<string, number>();
  const idsCodigos: string[] = [];

  list.forEach((row, idx) => {
    const codigo = normalizarCodigoPdv(row.codigo);
    idsCodigos.push(codigo || `(fila-${idx})`);
    if (!codigo) {
      excepciones.push({ tipo: 'sin_codigo', codigo: `(fila-${idx})`, detalle: 'CODIGO vacío' });
    }
    if (!String(row.descripcion || '').trim()) {
      excepciones.push({
        tipo: 'sin_nombre',
        codigo: codigo || `(fila-${idx})`,
        detalle: 'DESCRIPCION vacía'
      });
    }
    if (codigo) {
      const prev = seen.get(codigo);
      if (prev !== undefined) {
        excepciones.push({
          tipo: 'duplicado_codigo',
          codigo,
          detalle: `repetido (primera aparición índice ${prev}, ahora ${idx})`
        });
      } else {
        seen.set(codigo, idx);
      }
    }

    const clas = clasificarSkuPdv(row);
    porDestino[clas.destino] += 1;
    if (clas.esKit && clas.componentes.length === 0) {
      excepciones.push({
        tipo: 'kit_huerfano',
        codigo: codigo || `(fila-${idx})`,
        detalle: 'paquete sin COMPONENTES parseables'
      });
    }

    const precios = mapearPreciosPdvAKatzen({
      pfinal: row.pfinal,
      pventa: row.pventa,
      pcosto: row.pcosto,
      aplicarIva16: !clas.sugerirExentoIva
    });
    if (precios.precio_venta === null) {
      excepciones.push({
        tipo: 'sin_precio',
        codigo: codigo || `(fila-${idx})`,
        detalle: 'sin PFINAL ni PVENTA'
      });
    }
    if (
      precios.precio_compra != null &&
      precios.precio_neto != null &&
      precios.precio_compra >= precios.precio_neto
    ) {
      excepciones.push({
        tipo: 'costo_ge_neta',
        codigo: codigo || `(fila-${idx})`,
        detalle: `PCOSTO ${precios.precio_compra} ≥ neta ${precios.precio_neto}`
      });
    }
    if (clas.sugerirExentoIva) {
      const conIva = mapearPreciosPdvAKatzen({
        pfinal: row.pfinal,
        pventa: row.pventa,
        pcosto: row.pcosto,
        aplicarIva16: true
      });
      excepciones.push({
        tipo: 'iva_vs_exento_sugerido',
        codigo: codigo || `(fila-${idx})`,
        detalle: `categoría sugiere tasa 0; si se aplica *1.16 el público sería ${conIva.precio_venta}`
      });
    }
    const stock = Number(row.existencia);
    if (Number.isFinite(stock) && stock < 0) {
      excepciones.push({
        tipo: 'stock_negativo',
        codigo: codigo || `(fila-${idx})`,
        detalle: `existencia ${stock} → importar 0 + alerta`
      });
    }
  });

  return {
    totalFilas: list.length,
    porDestino,
    excepciones,
    idsCodigos
  };
}

export function conteoVsExportadas(countSql: number, filasExportadas: number): boolean {
  return Number(countSql) === Number(filasExportadas);
}
