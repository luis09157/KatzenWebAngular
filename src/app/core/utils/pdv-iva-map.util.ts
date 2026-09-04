/**
 * Spec 064 — mapeo de precios Eleventa (PDV) → Katzen.
 *
 * Hecho (Luis 2026-08-31): los precios de eleventa **no incluyen IVA**.
 * En Katzen el precio al público **incluye IVA 16%**.
 *
 *   precio_venta (incluye IVA) = round(PFINAL * 1.16, 2)
 *   neta                       = precio_venta / 1.16
 *   precio_compra              = PCOSTO (costo; no se le suma IVA)
 *   ganancia                   = neta − costo
 *
 * Nunca sumar 16 % otra vez en caja: el POS ya trata `precio_venta` como
 * precio con IVA incluido (`desglosarPrecioIvaIncluido`).
 */

import { TASA_IVA_GENERAL_MX } from './precio-margen.util';

export const TASA_IVA_PDV_MX = TASA_IVA_GENERAL_MX;
export const FACTOR_IVA_PDV = 1 + TASA_IVA_PDV_MX / 100; // 1.16

export function roundMoney2(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** ¿Hay un número usable (incluye 0)? Null/undefined/''/NaN → no. */
export function esMontoPdvPresente(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  return Number.isFinite(Number(value));
}

/**
 * Precio que cobraba el cajero en eleventa (sin IVA).
 * Preferir `PFINAL` (lo que paga el cliente); si falta, `PVENTA`.
 */
export function precioEleventaSinIva(input: {
  pfinal?: unknown;
  pventa?: unknown;
}): number | null {
  if (esMontoPdvPresente(input.pfinal)) {
    return roundMoney2(input.pfinal);
  }
  if (esMontoPdvPresente(input.pventa)) {
    return roundMoney2(input.pventa);
  }
  return null;
}

export interface PreciosPdvMapeados {
  /** PCOSTO; null si no venía. */
  precio_compra: number | null;
  /** Precio al público Katzen (incluye IVA 16%). */
  precio_venta: number | null;
  /** precio_venta / 1.16 (base gravable). */
  precio_neto: number | null;
  /** IVA trasladado = precio_venta − neto. */
  iva_trasladado: number | null;
  /** neta − costo; null si falta alguno. */
  ganancia: number | null;
  /** Lo que pagaban en eleventa (sin IVA). */
  precio_eleventa_sin_iva: number | null;
  /** Diferencia que verá el cliente: web − eleventa. */
  delta_precio_cliente: number | null;
  iva_aplicable: boolean;
  tasa_iva: number;
}

/**
 * Convierte una fila Eleventa al modelo de precios Katzen.
 *
 * @param aplicarIva16 default true (decisión Luis). Si false, `precio_venta` = PFINAL
 *   (casos a revisar: medicamento/vacuna con tasa 0 sugerida).
 */
export function mapearPreciosPdvAKatzen(input: {
  pfinal?: unknown;
  pventa?: unknown;
  pcosto?: unknown;
  aplicarIva16?: boolean;
}): PreciosPdvMapeados {
  const aplicar = input.aplicarIva16 !== false;
  const eleventa = precioEleventaSinIva(input);
  const costo = esMontoPdvPresente(input.pcosto) ? roundMoney2(input.pcosto) : null;

  if (eleventa === null) {
    return {
      precio_compra: costo,
      precio_venta: null,
      precio_neto: null,
      iva_trasladado: null,
      ganancia: null,
      precio_eleventa_sin_iva: null,
      delta_precio_cliente: null,
      iva_aplicable: aplicar,
      tasa_iva: aplicar ? TASA_IVA_PDV_MX : 0
    };
  }

  const precio_venta = aplicar ? roundMoney2(eleventa * FACTOR_IVA_PDV) : eleventa;
  const precio_neto = aplicar ? roundMoney2(precio_venta / FACTOR_IVA_PDV) : precio_venta;
  const iva_trasladado = roundMoney2(precio_venta - precio_neto);
  const ganancia = costo === null ? null : roundMoney2(precio_neto - costo);
  const delta_precio_cliente = roundMoney2(precio_venta - eleventa);

  return {
    precio_compra: costo,
    precio_venta,
    precio_neto,
    iva_trasladado,
    ganancia,
    precio_eleventa_sin_iva: eleventa,
    delta_precio_cliente,
    iva_aplicable: aplicar,
    tasa_iva: aplicar ? TASA_IVA_PDV_MX : 0
  };
}

export interface FilaImpactoIvaPdv {
  codigo: string;
  descripcion: string;
  precio_eleventa: number | null;
  precio_web_con_iva: number | null;
  delta: number | null;
  delta_pct: number | null;
}

/** Reporte para Luis: lo que pagaban vs lo que verán en web con IVA. */
export function reporteImpactoIvaCliente(
  rows: Array<{
    codigo?: string | null;
    descripcion?: string | null;
    pfinal?: unknown;
    pventa?: unknown;
    aplicarIva16?: boolean;
  }>
): FilaImpactoIvaPdv[] {
  return (rows || []).map((row) => {
    const m = mapearPreciosPdvAKatzen(row);
    const ele = m.precio_eleventa_sin_iva;
    const web = m.precio_venta;
    const delta_pct =
      ele != null && ele !== 0 && web != null
        ? roundMoney2(((web - ele) / ele) * 100)
        : null;
    return {
      codigo: String(row.codigo || '').trim() || '(sin código)',
      descripcion: String(row.descripcion || '').trim() || '(sin nombre)',
      precio_eleventa: ele,
      precio_web_con_iva: web,
      delta: m.delta_precio_cliente,
      delta_pct
    };
  });
}
