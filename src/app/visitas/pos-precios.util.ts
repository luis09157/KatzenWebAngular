import { ProductoPeluqueria, TipoServicio } from '../shared/banio.model';
import { CategoriaProducto, Producto } from '../shared/inventario.models';
import {
  DefaultsBanioPorTamano,
  TamanoPerroBanio,
  TAMANOS_PERRO_ORDEN
} from '../finanzas/defaults-banio.models';
import { PlantillaCosto } from '../finanzas/plantilla-costo.models';
import { resolverPrefillBanioPorTamano } from '../finanzas/banio-prefill.util';
import { rielDeProducto } from './pos-rieles.util';

/** Copy POS: productos/vacunas/medicamentos/consulta de catálogo. */
export const COPY_PRECIO_INVENTARIO = 'Precio de inventario';

/** Copy POS: única excepción editable (baño / peluquería). */
export const COPY_BANIO_AJUSTABLE = 'Puedes ajustar el precio de este baño';

export type AtajoPos = 'consulta' | 'vacuna' | 'medicamento' | 'producto' | 'banio';

export type FuentePrecioBanioPos =
  | 'defaults'
  | 'plantilla'
  | 'tipo_servicio'
  | 'inventario'
  | 'productos_peluqueria'
  | 'ninguno';

export interface PrecioBanioPosResult {
  precio: number | null;
  fuente: FuentePrecioBanioPos;
  editable: true;
  inputLabel: typeof COPY_BANIO_AJUSTABLE;
}

export interface DecisionPrecioInventario {
  pedirMonto: false;
  monto: number;
  producto?: Producto;
  origen: 'inventario';
  costoInterno: number | null;
}

export type DecisionMontoPos =
  | DecisionPrecioInventario
  | { pedirMonto: true; motivo: 'sin_precio_catalogo' }
  | { pedirMonto: false; error: 'sin_precio' };

export function esDecisionPrecioInventario(
  d: DecisionMontoPos
): d is DecisionPrecioInventario {
  return !d.pedirMonto && !('error' in d);
}

function positivo(n: unknown): number | null {
  if (n == null || n === '') return null;
  const v = Number(n);
  if (Number.isNaN(v) || v <= 0) return null;
  return v;
}

export function precioVentaInventario(
  producto: Pick<Producto, 'precio_venta'> | null | undefined
): number | null {
  return positivo(producto?.precio_venta);
}

export function costoInternoInventario(
  producto: Pick<Producto, 'precio_compra'> | null | undefined
): number | null {
  return positivo(producto?.precio_compra);
}

/** Nombre o subcategoría de servicio «Consulta» (no un tile vacío). */
export function esProductoConsultaCatalogo(
  producto: Pick<Producto, 'nombre' | 'subcategoria' | 'activo'> | null | undefined
): boolean {
  if (!producto || producto.activo === false) return false;
  const nom = String(producto.nombre || '').trim().toLowerCase();
  const sub = String(producto.subcategoria || '').trim().toLowerCase();
  return nom.includes('consulta') || sub === 'consulta';
}

export function encontrarProductoConsulta(
  productos: Producto[] | null | undefined
): Producto | null {
  const rows = (productos || []).filter((p) => p && p.activo !== false);
  const conPrecio = rows.filter(
    (p) => esProductoConsultaCatalogo(p) && precioVentaInventario(p) != null
  );
  if (!conPrecio.length) {
    return rows.find((p) => esProductoConsultaCatalogo(p)) || null;
  }
  const exacto = conPrecio.find((p) =>
    String(p.nombre || '').trim().toLowerCase().startsWith('consulta')
  );
  return exacto || conPrecio[0];
}

/**
 * Vacuna / medicamento / producto: nunca piden monto (van al ticket con `precio_venta`).
 * Consulta: pide solo si no hay producto de catálogo con precio.
 * Baño: siempre diálogo, pero con default precargado (no campo vacío si hay tarifa).
 */
export function atajoPideMonto(
  atajo: AtajoPos,
  catalogo: Producto[] | null | undefined = []
): boolean {
  if (atajo === 'vacuna' || atajo === 'medicamento' || atajo === 'producto') {
    return false;
  }
  if (atajo === 'banio') return true;
  if (atajo === 'consulta') {
    const prod = encontrarProductoConsulta(catalogo);
    return precioVentaInventario(prod) == null;
  }
  return false;
}

export function resolverLineaProductoInventario(producto: Producto): DecisionMontoPos {
  const monto = precioVentaInventario(producto);
  if (monto == null) {
    return { pedirMonto: false, error: 'sin_precio' };
  }
  return {
    pedirMonto: false,
    monto,
    producto,
    origen: 'inventario',
    costoInterno: costoInternoInventario(producto)
  };
}

export function resolverAtajoConsulta(
  catalogo: Producto[] | null | undefined
): DecisionMontoPos {
  const producto = encontrarProductoConsulta(catalogo);
  const monto = precioVentaInventario(producto);
  if (producto && monto != null) {
    return {
      pedirMonto: false,
      monto,
      producto,
      origen: 'inventario',
      costoInterno: costoInternoInventario(producto)
    };
  }
  return { pedirMonto: true, motivo: 'sin_precio_catalogo' };
}

export function filtrarCatalogoPorCategoria(
  productos: Producto[] | null | undefined,
  categoria: CategoriaProducto
): Producto[] {
  return (productos || []).filter(
    (p) => p && p.activo !== false && p.categoria === categoria
  );
}

export function inferirTamanoBanio(
  paciente: { tamano_perro?: string; tamano?: string } | null | undefined
): TamanoPerroBanio | '' {
  const raw = String(paciente?.tamano_perro || paciente?.tamano || '')
    .trim()
    .toLowerCase();
  if (raw === 'pequeno' || raw === 'pequeño' || raw === 'chico' || raw === 'small') {
    return 'pequeno';
  }
  if (raw === 'mediano' || raw === 'medium') return 'mediano';
  if (raw === 'grande' || raw === 'large') return 'grande';
  return '';
}

function precioTipoServicioBanio(
  tipos: Array<Pick<TipoServicio, 'nombre' | 'precio_base' | 'activo'>> | null | undefined
): number | null {
  const activos = (tipos || []).filter((t) => t && t.activo !== false);
  const banio = activos.find((t) =>
    String(t.nombre || '').toLowerCase().includes('baño')
  );
  return (
    positivo(banio?.precio_base) ??
    positivo(activos.find((t) => positivo(t.precio_base))?.precio_base)
  );
}

function precioProductoPeluqueria(
  productos: Array<Pick<ProductoPeluqueria, 'nombre' | 'precio' | 'activo'>> | null | undefined
): number | null {
  const activos = (productos || []).filter((p) => p && p.activo !== false);
  const banio = activos.find((p) =>
    String(p.nombre || '').toLowerCase().includes('baño')
  );
  return positivo(banio?.precio) ?? positivo(activos.find((p) => positivo(p.precio))?.precio);
}

function precioInventarioPeluqueria(
  catalogo: Producto[] | null | undefined
): number | null {
  const rows = (catalogo || []).filter((p) => p && p.activo !== false);
  const pelu = rows.find(
    (p) => rielDeProducto(p) === 'peluqueria' && precioVentaInventario(p) != null
  );
  return precioVentaInventario(pelu);
}

/**
 * Default de baño para el diálogo POS (editable).
 * Cascada: plantilla 022 / defaults por tamaño → tipo servicio → inventario peluquería → ProductosPeluqueria.
 */
export function resolverPrecioBanioPos(input: {
  tamano?: TamanoPerroBanio | '' | null;
  defaults?: DefaultsBanioPorTamano | null;
  plantillas?: PlantillaCosto[] | null;
  tiposServicio?: Array<Pick<TipoServicio, 'nombre' | 'precio_base' | 'activo'>> | null;
  productosPeluqueria?: Array<Pick<ProductoPeluqueria, 'nombre' | 'precio' | 'activo'>> | null;
  catalogoInventario?: Producto[] | null;
}): PrecioBanioPosResult {
  const plantillas = input.plantillas || [];
  const tamanos: TamanoPerroBanio[] = input.tamano
    ? [input.tamano, ...TAMANOS_PERRO_ORDEN.filter((t) => t !== input.tamano)]
    : ['mediano', ...TAMANOS_PERRO_ORDEN.filter((t) => t !== 'mediano')];

  for (const tamano of tamanos) {
    const prefill = resolverPrefillBanioPorTamano(tamano, input.defaults, plantillas);
    if (prefill.precioSugerido != null) {
      return {
        precio: prefill.precioSugerido,
        fuente: prefill.fuente === 'plantilla' ? 'plantilla' : 'defaults',
        editable: true,
        inputLabel: COPY_BANIO_AJUSTABLE
      };
    }
  }

  const tipo = precioTipoServicioBanio(input.tiposServicio);
  if (tipo != null) {
    return {
      precio: tipo,
      fuente: 'tipo_servicio',
      editable: true,
      inputLabel: COPY_BANIO_AJUSTABLE
    };
  }

  const inventario = precioInventarioPeluqueria(input.catalogoInventario);
  if (inventario != null) {
    return {
      precio: inventario,
      fuente: 'inventario',
      editable: true,
      inputLabel: COPY_BANIO_AJUSTABLE
    };
  }

  const peluqueria = precioProductoPeluqueria(input.productosPeluqueria);
  if (peluqueria != null) {
    return {
      precio: peluqueria,
      fuente: 'productos_peluqueria',
      editable: true,
      inputLabel: COPY_BANIO_AJUSTABLE
    };
  }

  return {
    precio: null,
    fuente: 'ninguno',
    editable: true,
    inputLabel: COPY_BANIO_AJUSTABLE
  };
}

export function valorInicialPromptBanio(precioDefault: number | null): number | '' {
  return precioDefault != null && precioDefault > 0 ? precioDefault : '';
}
