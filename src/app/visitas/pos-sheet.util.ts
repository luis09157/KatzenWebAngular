/**
 * Estado / validación de bottom sheets del POS (producto, línea, carrito, scanner).
 * Extraído de `visita-dialog` (spec 077) — sin cambiar semántica táctil.
 */
import { filtrarProductos } from '../core/utils/producto-search.util';
import { Producto } from '../shared/inventario.models';
import { VisitaLinea } from './visitas.models';
import { cantidadLinea, precioUnitarioLinea, roundMoney } from './visitas.util';

export type PosSheetModo = 'producto' | 'linea' | 'carrito' | 'scanner';

export interface PosSheetSnapshot {
  abierta: boolean;
  modo: PosSheetModo;
  producto: Producto | null;
  linea: VisitaLinea | null;
  qty: number;
  scannerCodigo: string;
}

export const POS_SHEET_CERRADA: PosSheetSnapshot = {
  abierta: false,
  modo: 'producto',
  producto: null,
  linea: null,
  qty: 1,
  scannerCodigo: '',
};

export function tituloPosSheet(
  modo: PosSheetModo,
  producto: Pick<Producto, 'nombre'> | null | undefined,
  linea: Pick<VisitaLinea, 'descripcion'> | null | undefined
): string {
  if (modo === 'scanner') return 'Código o QR';
  if (modo === 'linea') return linea?.descripcion || 'Línea';
  return producto?.nombre || 'Producto';
}

export function montoPreviewPosSheet(
  modo: PosSheetModo,
  qty: number,
  producto: Pick<Producto, 'precio_venta'> | null | undefined,
  linea: Pick<VisitaLinea, 'cantidad' | 'monto'> | null | undefined
): number {
  const q = Math.max(1, Number(qty) || 1);
  if (modo === 'linea' && linea) {
    return roundMoney(precioUnitarioLinea(linea) * q);
  }
  if (producto) {
    return roundMoney((Number(producto.precio_venta) || 0) * q);
  }
  return 0;
}

/** Puede quitar línea desde sheet solo si no hay pagos ni salida de inventario vinculada. */
export function puedeQuitarLineaSheet(
  pagado: number,
  linea: Pick<VisitaLinea, 'movimientoInventarioId'> | null | undefined
): boolean {
  return (Number(pagado) || 0) <= 0 && !linea?.movimientoInventarioId;
}

export function sheetQtyMas(qty: number): number {
  return Math.max(1, (Number(qty) || 1) + 1);
}

export function sheetQtyMenos(qty: number): number {
  const q = Math.max(1, Number(qty) || 1);
  return q > 1 ? q - 1 : 1;
}

export function abrirSheetProducto(p: Producto): PosSheetSnapshot {
  return {
    abierta: true,
    modo: 'producto',
    producto: p,
    linea: null,
    qty: 1,
    scannerCodigo: '',
  };
}

export function abrirSheetLinea(l: VisitaLinea): PosSheetSnapshot {
  return {
    abierta: true,
    modo: 'linea',
    producto: null,
    linea: l,
    qty: cantidadLinea(l),
    scannerCodigo: '',
  };
}

export function abrirSheetCarrito(): PosSheetSnapshot {
  return {
    abierta: true,
    modo: 'carrito',
    producto: null,
    linea: null,
    qty: 1,
    scannerCodigo: '',
  };
}

export function abrirSheetScanner(codigoInicial = ''): PosSheetSnapshot {
  return {
    abierta: true,
    modo: 'scanner',
    producto: null,
    linea: null,
    qty: 1,
    scannerCodigo: String(codigoInicial || '').trim(),
  };
}

export function cerrarPosSheet(prev?: Partial<PosSheetSnapshot>): PosSheetSnapshot {
  return {
    ...POS_SHEET_CERRADA,
    modo: prev?.modo || 'producto',
    scannerCodigo: '',
  };
}

/**
 * Match de escáner: código de barras exacto, o único hit del filtro.
 * Misma regla que `aplicarCodigoEscaneado` en visita-dialog.
 */
export function resolverProductoEscaneado(catalogo: Producto[] | null | undefined, codigo: string): Producto | null {
  const q = String(codigo || '').trim();
  if (!q) return null;
  const hits = filtrarProductos(catalogo, q);
  const exact =
    hits.find((p) => String(p.codigo_barras || '').toLowerCase() === q.toLowerCase()) ||
    (hits.length === 1 ? hits[0] : null);
  return exact || null;
}

/** Delta de cantidad al confirmar sheet de línea (0 = sin cambio). */
export function deltaCantidadConfirmSheet(linea: VisitaLinea | null | undefined, sheetQty: number): number {
  if (!linea) return 0;
  const actual = cantidadLinea(linea);
  const next = Math.max(1, Number(sheetQty) || 1);
  return next - actual;
}
