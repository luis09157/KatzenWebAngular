/**
 * Filtros del catálogo de productos (fase 2 UX, 2026-10-26).
 * Solo lectura: decide qué productos se ven; no cambia datos.
 */
import { Producto } from '../shared/inventario.models';
import { etiquetaCategoriaProducto } from './productos/producto-identificacion.util';
import { requiereAlertaStockBajo } from './inventario-alertas.util';

export interface FiltroCatalogo {
  texto: string;
  /** Valor guardado de la categoría ('' = todas). */
  categoria: string;
  /** Solo lo que está en o abajo del mínimo. */
  porPedir: boolean;
}

/**
 * Hay que pedirlo: misma regla que la alerta de stock bajo (en/abajo del mínimo,
 * sin contar servicios ni productos inactivos), para que los números coincidan.
 */
export function esPorPedir(p: Producto): boolean {
  return requiereAlertaStockBajo(p);
}

function normalizar(t: unknown): string {
  return String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function coincideCatalogo(p: Producto, f: FiltroCatalogo): boolean {
  if (f.porPedir && !esPorPedir(p)) return false;
  if (f.categoria && normalizar(p?.categoria) !== normalizar(f.categoria)) return false;
  const q = normalizar(f.texto).trim();
  if (!q) return true;
  const campos = [p?.nombre, p?.codigo_barras, p?.marca, p?.presentacion, etiquetaCategoriaProducto(p?.categoria)];
  return q.split(/\s+/).every((palabra) => campos.some((c) => normalizar(c).includes(palabra)));
}

/** Categorías presentes (para los botones), con su etiqueta bonita y cuántos hay. */
export function categoriasDelCatalogo(productos: Producto[]): Array<{ valor: string; etiqueta: string; total: number }> {
  const m = new Map<string, { valor: string; etiqueta: string; total: number }>();
  for (const p of productos || []) {
    const valor = String(p?.categoria || '').trim();
    if (!valor) continue;
    const key = normalizar(valor);
    const item = m.get(key) || { valor, etiqueta: etiquetaCategoriaProducto(valor), total: 0 };
    item.total++;
    m.set(key, item);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}
