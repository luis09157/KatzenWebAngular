import { MOCK_PRODUCTO_INVENTARIO } from '../testing/mock-data';
import {
  filtrarProductos,
  getProductoDisplayLabel,
  productoDescuentaInventarioPos,
  productoSinStock,
  productoStockBajo,
} from './producto-search.util';

const croquetas = {
  ...MOCK_PRODUCTO_INVENTARIO,
  id: 'mock-alimento-001',
  codigo_barras: 'KZ-ALI-260827-ABCD',
  nombre: 'Croquetas adultas',
  categoria: 'alimento' as const,
  marca: 'Royal',
  presentacion: 'Bolsa 2 kg',
  stock_actual: 0,
  stock_minimo: 2,
  requiere_receta: false,
};

describe('producto-search.util', () => {
  const lista = [MOCK_PRODUCTO_INVENTARIO, croquetas];

  it('etiqueta nombre · presentación', () => {
    expect(getProductoDisplayLabel(MOCK_PRODUCTO_INVENTARIO)).toBe('Antibiótico Mock · Caja 10 tab');
  });

  it('sin query devuelve activos (límite)', () => {
    expect(filtrarProductos(lista, '').length).toBe(2);
    expect(filtrarProductos(lista, null).length).toBe(2);
  });

  it('filtra por nombre, marca y categoría', () => {
    expect(filtrarProductos(lista, 'croquetas')[0].id).toBe('mock-alimento-001');
    expect(filtrarProductos(lista, 'royal')[0].id).toBe('mock-alimento-001');
    expect(filtrarProductos(lista, 'medicamento')[0].id).toBe('mock-producto-001');
  });

  it('código exacto (QR / EAN) va primero', () => {
    const r = filtrarProductos(lista, '7501234567890');
    expect(r[0].id).toBe('mock-producto-001');
  });

  it('acepta objeto Producto como query (autocomplete)', () => {
    const r = filtrarProductos(lista, MOCK_PRODUCTO_INVENTARIO);
    expect(r.some((p) => p.id === 'mock-producto-001')).toBe(true);
  });

  it('stock bajo / sin stock', () => {
    expect(productoStockBajo(MOCK_PRODUCTO_INVENTARIO)).toBe(false);
    expect(productoSinStock(croquetas)).toBe(true);
    expect(productoStockBajo(croquetas)).toBe(true);
  });

  it('baños BACO / tarifas peluquería no bloquean por stock 0', () => {
    const baco = {
      ...croquetas,
      id: 'baco-1',
      codigo_barras: 'BACO001',
      pdvCodigo: 'BACO001',
      nombre: 'Baño Grande Pelo Corto',
      categoria: 'peluqueria' as const,
      stock_actual: 0,
    };
    expect(productoDescuentaInventarioPos(baco)).toBe(false);
    expect(productoSinStock(baco)).toBe(false);
    expect(productoStockBajo(baco)).toBe(false);
  });

  it('shampoo peluquería sí controla stock', () => {
    const shampoo = {
      ...croquetas,
      id: 'sh-1',
      codigo_barras: '750111',
      nombre: 'Shampoo Hipoalergenico',
      categoria: 'peluqueria' as const,
      stock_actual: 0,
    };
    expect(productoDescuentaInventarioPos(shampoo)).toBe(true);
    expect(productoSinStock(shampoo)).toBe(true);
  });
});
