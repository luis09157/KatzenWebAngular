import { Producto } from '../shared/inventario.models';
import { VisitaLinea } from './visitas.models';
import type { PosRiel } from './pos-rieles.util';

/**
 * Catálogo de muestra del POS (055). Solo preview UI.
 * Nunca persistir a `Katzen/Inventario/Productos` ni pasar a `registrarSalida` / `crearProducto`.
 */

export const PREFIJO_ID_DEMO_POS = 'demo-pos-';
export const ORIGEN_POS_PREVIEW = 'pos_preview' as const;
export const BANNER_CATALOGO_DEMO_POS = 'Catálogo de muestra — no se guarda';

/** Push keys de Firebase RTDB: `-` + 19 chars del charset de push. */
export const PATRON_PUSH_RTDB = /^-[-_0-9A-Za-z]{19}$/;

export interface EnvCatalogoDemoPos {
  production?: boolean;
  usarCatalogoDemoPos?: boolean;
}

export function esIdPushRtdb(id: string | null | undefined): boolean {
  return PATRON_PUSH_RTDB.test(String(id || '').trim());
}

export function esIdProductoDemoPos(id: string | null | undefined): boolean {
  return String(id || '').startsWith(PREFIJO_ID_DEMO_POS);
}

export function esProductoDemoPos(
  producto?: Pick<Producto, 'id' | 'soloDemo' | 'origen'> | null
): boolean {
  if (!producto) return false;
  return (
    producto.soloDemo === true ||
    producto.origen === ORIGEN_POS_PREVIEW ||
    esIdProductoDemoPos(producto.id)
  );
}

/**
 * Default **OFF** en producción. Solo true si el flag está explícito
 * (`environment.usarCatalogoDemoPos` en localhost).
 */
export function debeMostrarCatalogoDemoPos(env: EnvCatalogoDemoPos): boolean {
  if (env.production === true) return env.usarCatalogoDemoPos === true;
  return env.usarCatalogoDemoPos === true;
}

/**
 * Con preview OFF: solo RTDB (sin ítems demo colados).
 * Con preview ON: demo primero (para verlos) y después reales — nunca al revés.
 */
export function mezclarCatalogoPos(
  rtdb: Producto[] | null | undefined,
  demo: Producto[] | null | undefined,
  usarDemo: boolean
): Producto[] {
  const reales = (rtdb || []).filter((p) => p && !esProductoDemoPos(p));
  if (!usarDemo) return reales;
  const demos = (demo || []).filter(esProductoDemoPos);
  return [...demos, ...reales];
}

export function contarDemoPorRiel(
  productos: Producto[] | null | undefined
): Record<PosRiel, number> {
  const demo = (productos || []).filter(esProductoDemoPos);
  return {
    petshop: demo.filter((p) => p.rielPos === 'petshop').length,
    consulta: demo.filter((p) => p.rielPos === 'consulta').length,
    peluqueria: demo.filter((p) => p.rielPos === 'peluqueria').length
  };
}

export function lineasSinProductosDemo(
  lineas: VisitaLinea[] | null | undefined,
  catalogo: Producto[] | null | undefined
): VisitaLinea[] {
  const cat = catalogo || [];
  return (lineas || []).filter((linea) => {
    if (!linea.productoId) return true;
    if (esIdProductoDemoPos(linea.productoId)) return false;
    const prod = cat.find((p) => p.id === linea.productoId);
    return !esProductoDemoPos(prod);
  });
}

/** IDs que SÍ pueden ir a `InventarioService.registrarSalida`. Demo → nunca. */
export function idsElegiblesParaRegistrarSalida(
  lineas: VisitaLinea[] | null | undefined,
  catalogo: Producto[] | null | undefined
): string[] {
  return lineasSinProductosDemo(lineas, catalogo)
    .filter((l) => l.categoria === 'venta_producto' && !!l.productoId)
    .map((l) => String(l.productoId));
}

/** Productos que SÍ pueden ir a `InventarioService.crearProducto`. Demo → ninguno. */
export function productosElegiblesParaCrearEnInventario(
  productos: Producto[] | null | undefined
): Producto[] {
  return (productos || []).filter((p) => !esProductoDemoPos(p));
}
