import { Producto } from '../../shared/inventario.models';

const LIMITE_RESULTADOS = 40;

export function getProductoDisplayLabel(producto: Producto | null | undefined): string {
  if (!producto) return '';
  const nombre = String(producto.nombre || '').trim();
  const presentacion = String(producto.presentacion || '').trim();
  if (nombre && presentacion) return `${nombre} · ${presentacion}`;
  return nombre;
}

function textoProducto(producto: Producto): string {
  return [
    producto.nombre,
    producto.codigo_barras,
    producto.marca,
    producto.presentacion,
    producto.categoria,
    producto.subcategoria
  ]
    .map(v => String(v || '').toLowerCase())
    .join(' ');
}

function queryDesdeValor(query: unknown): string {
  if (query == null || query === '') return '';
  if (typeof query === 'string') return query.trim().toLowerCase();
  if (typeof query === 'object') {
    const p = query as Producto;
    return String(p.nombre || p.codigo_barras || '').trim().toLowerCase();
  }
  return '';
}

/**
 * Filtra productos activos por nombre, código (QR/EAN), marca, presentación o categoría.
 * Coincidencia exacta de código primero (pegado desde escáner).
 */
export function filtrarProductos(productos: Producto[] | null | undefined, query: unknown): Producto[] {
  const activos = (productos || []).filter(p => p && p.activo !== false);
  const filtro = queryDesdeValor(query);
  if (!filtro) return activos.slice(0, LIMITE_RESULTADOS);

  const exactos = activos.filter(p => String(p.codigo_barras || '').trim().toLowerCase() === filtro);
  const resto = activos.filter(p => {
    if (exactos.includes(p)) return false;
    return textoProducto(p).includes(filtro);
  });
  return [...exactos, ...resto].slice(0, LIMITE_RESULTADOS);
}

export function productoStockBajo(producto: Producto | null | undefined): boolean {
  if (!producto) return false;
  const stock = Number(producto.stock_actual) || 0;
  const min = Number(producto.stock_minimo) || 0;
  return min > 0 && stock <= min;
}

export function productoSinStock(producto: Producto | null | undefined): boolean {
  return (Number(producto?.stock_actual) || 0) <= 0;
}
