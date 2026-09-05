/**
 * Spec 070 / 064 F4 — kits en POS: validar BOM y armar N salidas de componentes.
 * No inventa componentes. Si no hay BOM, el caller muestra
 * «Este paquete no tiene componentes cargados».
 */
import { Producto } from '../shared/inventario.models';
import { normalizarCodigoPdv } from '../core/utils/pdv-sku-clasificacion.util';

export const MENSAJE_KIT_SIN_BOM = 'Este paquete no tiene componentes cargados';

export interface KitComponenteResuelto {
  productoId: string;
  codigo: string;
  nombre: string;
  /** Unidades del componente por 1 kit. */
  cantidadUnitaria: number;
  /** Unidades a descontar: unitaria × cantidad de kits. */
  cantidad: number;
  stock: number;
}

export type KitBomMotivo = 'ok' | 'no_es_kit' | 'sin_bom' | 'componente_faltante' | 'sin_stock';

export interface KitBomResultado {
  ok: boolean;
  motivo: KitBomMotivo;
  mensaje: string;
  /** Línea del ticket sigue siendo el SKU kit. */
  kit: Producto;
  cantidadKit: number;
  salidas: KitComponenteResuelto[];
}

export interface LineaCarritoKit {
  productoId?: string;
  cantidad?: number;
  categoria?: string;
}

function codigoDeProducto(p: Producto | null | undefined): string {
  return normalizarCodigoPdv(p?.pdvCodigo || p?.codigo_barras || '');
}

/** BOM persistido en el producto (array). No parsea strings inventados. */
export function bomDeProducto(p: Producto | null | undefined): { codigo: string; cantidad: number }[] {
  const raw = p?.kitComponentes;
  if (!Array.isArray(raw) || !raw.length) return [];
  const out: { codigo: string; cantidad: number }[] = [];
  for (const row of raw) {
    const codigo = normalizarCodigoPdv(row?.codigo);
    const cantidad = Number(row?.cantidad);
    if (!codigo || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    out.push({ codigo, cantidad });
  }
  return out;
}

export function productoEsKit(p: Producto | null | undefined): boolean {
  if (!p) return false;
  return !!p.esKit || bomDeProducto(p).length > 0;
}

export function buscarProductoPorCodigoKit(
  catalogo: Producto[] | null | undefined,
  codigo: string
): Producto | undefined {
  const c = normalizarCodigoPdv(codigo);
  if (!c) return undefined;
  return (catalogo || []).find((p) => p && p.activo !== false && codigoDeProducto(p) === c);
}

/**
 * Reserva en carrito: productos sueltos + componentes de otros kits.
 * El SKU kit no reserva su propio stock.
 */
export function stockReservadoEnCarrito(
  lineas: LineaCarritoKit[] | null | undefined,
  catalogo: Producto[] | null | undefined
): Record<string, number> {
  const reserved: Record<string, number> = {};
  const cat = catalogo || [];
  for (const linea of lineas || []) {
    if (linea.categoria && linea.categoria !== 'venta_producto') continue;
    const pid = String(linea.productoId || '').trim();
    if (!pid) continue;
    const qty = Math.max(0, Number(linea.cantidad) || 0);
    if (!qty) continue;
    const prod = cat.find((p) => p?.id === pid);
    if (productoEsKit(prod) && bomDeProducto(prod).length) {
      const r = resolverVentaKit(prod!, qty, cat, {});
      if (r.ok) {
        for (const s of r.salidas) {
          reserved[s.productoId] = (reserved[s.productoId] || 0) + s.cantidad;
        }
      }
      continue;
    }
    reserved[pid] = (reserved[pid] || 0) + qty;
  }
  return reserved;
}

export function resolverVentaKit(
  kit: Producto,
  cantidadKit: number,
  catalogo: Producto[] | null | undefined,
  reservedByProductId: Record<string, number> = {}
): KitBomResultado {
  const qty = Math.max(1, Number(cantidadKit) || 1);
  const base = {
    kit,
    cantidadKit: qty,
    salidas: [] as KitComponenteResuelto[],
  };
  if (!productoEsKit(kit)) {
    return { ...base, ok: true, motivo: 'no_es_kit', mensaje: '' };
  }
  const bom = bomDeProducto(kit);
  if (!bom.length) {
    return {
      ...base,
      ok: false,
      motivo: 'sin_bom',
      mensaje: MENSAJE_KIT_SIN_BOM,
    };
  }
  const salidas: KitComponenteResuelto[] = [];
  for (const comp of bom) {
    const prod = buscarProductoPorCodigoKit(catalogo, comp.codigo);
    if (!prod?.id) {
      return {
        ...base,
        ok: false,
        motivo: 'componente_faltante',
        mensaje: `Falta el componente ${comp.codigo} en el inventario.`,
      };
    }
    const cantidad = comp.cantidad * qty;
    const stock = Number(prod.stock_actual) || 0;
    const reservado = reservedByProductId[prod.id] || 0;
    if (stock - reservado < cantidad) {
      return {
        ...base,
        ok: false,
        motivo: 'sin_stock',
        mensaje: `"${prod.nombre}" tiene ${Math.max(0, stock - reservado)} y el paquete necesita ${cantidad}.`,
      };
    }
    salidas.push({
      productoId: prod.id,
      codigo: comp.codigo,
      nombre: prod.nombre,
      cantidadUnitaria: comp.cantidad,
      cantidad,
      stock,
    });
  }
  return {
    ok: true,
    motivo: 'ok',
    mensaje: '',
    kit,
    cantidadKit: qty,
    salidas,
  };
}
