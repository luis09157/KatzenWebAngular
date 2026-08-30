import {
  MOCK_POS_IMAGEN_DATA_URI,
  MOCK_PRODUCTO_ACCESORIO_IVA,
  MOCK_PRODUCTO_POS_ACCESORIO_SIN_FOTO,
  MOCK_PRODUCTOS_POS
} from '../core/testing/mock-data';
import {
  iconoPlaceholderPos,
  kindPlaceholderLinea,
  kindPlaceholderProducto,
  tieneFotoProducto,
  urlFotoProducto
} from './pos-foto.util';

describe('pos-foto.util (055 UI redo)', () => {
  it('usa imagen_url local 043 y placeholder si no hay foto', () => {
    const conFoto = MOCK_PRODUCTOS_POS[0];
    const sinFoto = MOCK_PRODUCTO_POS_ACCESORIO_SIN_FOTO;
    expect(tieneFotoProducto(conFoto)).toBe(true);
    expect(urlFotoProducto(conFoto)).toContain('assets/pos-demo/');
    expect(tieneFotoProducto(sinFoto)).toBe(false);
    expect(urlFotoProducto(sinFoto)).toBe('');
    expect(urlFotoProducto(null)).toBe('');
    expect(urlFotoProducto({})).toBe('');
    expect(urlFotoProducto({ imagen_url: MOCK_POS_IMAGEN_DATA_URI })).toContain('data:image');
  });

  it('mapea icono de placeholder por tipo (producto y servicios)', () => {
    expect(iconoPlaceholderPos('producto')).toBe('inventory_2');
    expect(iconoPlaceholderPos('consulta')).toBe('medical_services');
    expect(iconoPlaceholderPos('vacuna')).toBe('vaccines');
    expect(iconoPlaceholderPos('banio')).toBe('spa');
    expect(kindPlaceholderProducto(MOCK_PRODUCTO_ACCESORIO_IVA.categoria)).toBe('producto');
    expect(kindPlaceholderProducto('medicamento')).toBe('medicamento');
    expect(kindPlaceholderLinea('consulta', false)).toBe('consulta');
    expect(kindPlaceholderLinea('venta_producto', true)).toBe('producto');
  });

  it('el catálogo mock es solo lectura: 6 demo con foto, no muta fichas', () => {
    const snapshot = MOCK_PRODUCTOS_POS.map((p) => p.nombre);
    expect(snapshot.length).toBe(6);
    expect(MOCK_PRODUCTOS_POS.every((p) => p.id?.startsWith('demo-pos-'))).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => !!p.imagen_url)).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => p.soloDemo === true)).toBe(true);
  });
});
