/**
 * Alertas de inventario sin ruido (2026-10-26).
 * Había 288 «stock bajo», casi todas de servicios guardados como producto (stock 0, mínimo 0)
 * o artículos sin mínimo definido. Regla nueva:
 * - Stock bajo / punto de reorden: solo mercancía con MÍNIMO definido (> 0).
 * - Caducidad: solo si queda stock.
 * - Peluquería y diagnóstico son servicios: nunca alertan por stock.
 */
import { Alerta, Producto } from '../shared/inventario.models';

export const CATEGORIAS_SERVICIO_EN_INVENTARIO: ReadonlyArray<string> = ['peluqueria', 'diagnostico'];

type ProductoAlerta = Pick<Producto, 'categoria' | 'stock_actual' | 'stock_minimo'> &
  Partial<Pick<Producto, 'activo' | 'punto_reorden' | 'fecha_caducidad'>>;

export function esServicioEnInventario(p: Pick<Producto, 'categoria'> | null | undefined): boolean {
  return CATEGORIAS_SERVICIO_EN_INVENTARIO.includes(String(p?.categoria || '').toLowerCase());
}

/** ¿Este producto debe alertar por stock bajo hoy? */
export function requiereAlertaStockBajo(p: ProductoAlerta | null | undefined): boolean {
  if (!p || p.activo === false || esServicioEnInventario(p)) return false;
  const minimo = Number(p.stock_minimo) || 0;
  if (minimo <= 0) return false;
  return (Number(p.stock_actual) || 0) <= minimo;
}

/** ¿Este producto alcanzó su punto de reorden (sin llegar al mínimo)? */
export function requiereAlertaReorden(p: ProductoAlerta | null | undefined): boolean {
  if (!p || p.activo === false || esServicioEnInventario(p)) return false;
  const reorden = Number(p.punto_reorden) || 0;
  const stock = Number(p.stock_actual) || 0;
  if (reorden <= 0) return false;
  return stock <= reorden && !requiereAlertaStockBajo(p);
}

/** Una alerta guardada sigue contando solo si el producto todavía cumple la regla. */
export function alertaSigueVigente(alerta: Pick<Alerta, 'tipo'>, p: ProductoAlerta | null | undefined): boolean {
  if (!p || p.activo === false) return false;
  switch (alerta.tipo) {
    case 'stock_bajo':
      return requiereAlertaStockBajo(p);
    case 'punto_reorden':
      return requiereAlertaReorden(p);
    case 'por_caducar':
    case 'caducado':
      return !!p.fecha_caducidad && (Number(p.stock_actual) || 0) > 0;
    default:
      return true;
  }
}
