import {
  MOCK_DEFAULTS_BANIO_TAMANO,
  MOCK_PLANTILLA_COSTO,
  MOCK_PRODUCTO_INVENTARIO,
  MOCK_PRODUCTOS_POS
} from '../core/testing/mock-data';
import { emptyDefaultsBanio } from '../finanzas/defaults-banio.models';
import { PlantillaCosto } from '../finanzas/plantilla-costo.models';
import { Producto } from '../shared/inventario.models';
import { MOCK_PRODUCTO_DEMO_POS_CONSULTA } from './pos-catalogo-demo.data';
import {
  COPY_BANIO_AJUSTABLE,
  COPY_PRECIO_INVENTARIO,
  atajoPideMonto,
  encontrarProductoConsulta,
  filtrarCatalogoPorCategoria,
  inferirTamanoBanio,
  precioVentaInventario,
  esDecisionPrecioInventario,
  resolverAtajoConsulta,
  resolverLineaProductoInventario,
  resolverPrecioBanioPos,
  valorInicialPromptBanio
} from './pos-precios.util';

function prod(parcial: Partial<Producto> & Pick<Producto, 'categoria'>): Producto {
  return {
    ...MOCK_PRODUCTO_INVENTARIO,
    codigo_barras: 'X',
    ...parcial
  } as Producto;
}

describe('pos-precios.util', () => {
  it('producto con precio_venta arma línea sin prompt', () => {
    const p = prod({
      id: 'med-1',
      categoria: 'medicamento',
      nombre: 'Amoxi',
      precio_venta: 120,
      precio_compra: 40
    });
    expect(atajoPideMonto('producto', [p])).toBe(false);
    expect(atajoPideMonto('medicamento', [p])).toBe(false);
    expect(atajoPideMonto('vacuna', [p])).toBe(false);
    const linea = resolverLineaProductoInventario(p);
    expect(esDecisionPrecioInventario(linea)).toBe(true);
    if (!esDecisionPrecioInventario(linea)) {
      fail('debía resolver precio de inventario');
      return;
    }
    expect(linea.monto).toBe(120);
    expect(linea.origen).toBe('inventario');
    expect(linea.costoInterno).toBe(40);
    expect(COPY_PRECIO_INVENTARIO).toBe('Precio de inventario');
  });

  it('vacuna/medicamento se listan del inventario; no hay atajo genérico que pida monto', () => {
    const med = prod({ id: 'm1', categoria: 'medicamento', nombre: 'Meloxi', precio_venta: 85 });
    const vac = prod({ id: 'v1', categoria: 'vacuna', nombre: 'Antirrábica', precio_venta: 180 });
    expect(filtrarCatalogoPorCategoria([med, vac], 'medicamento').map((p) => p.id)).toEqual(['m1']);
    expect(filtrarCatalogoPorCategoria([med, vac], 'vacuna').map((p) => p.id)).toEqual(['v1']);
    expect(atajoPideMonto('vacuna', [vac])).toBe(false);
    expect(resolverLineaProductoInventario(vac).pedirMonto).toBe(false);
  });

  it('consulta con producto de catálogo usa precio_venta (sin prompt)', () => {
    const consulta = MOCK_PRODUCTO_DEMO_POS_CONSULTA;
    expect(encontrarProductoConsulta(MOCK_PRODUCTOS_POS)?.id).toBe(consulta.id);
    expect(atajoPideMonto('consulta', MOCK_PRODUCTOS_POS)).toBe(false);
    const d = resolverAtajoConsulta(MOCK_PRODUCTOS_POS);
    expect(esDecisionPrecioInventario(d)).toBe(true);
    if (!esDecisionPrecioInventario(d)) {
      fail('consulta demo debe traer precio');
      return;
    }
    expect(d.monto).toBe(consulta.precio_venta);
    expect(d.producto?.id).toBe(consulta.id);
  });

  it('consulta sin precio en catálogo → fallback pedir monto', () => {
    const sinPrecio = prod({
      id: 'c-vacia',
      categoria: 'diagnostico',
      nombre: 'Consulta general',
      subcategoria: 'consulta',
      precio_venta: 0
    });
    expect(precioVentaInventario(sinPrecio)).toBeNull();
    expect(atajoPideMonto('consulta', [sinPrecio])).toBe(true);
    expect(resolverAtajoConsulta([sinPrecio])).toEqual({
      pedirMonto: true,
      motivo: 'sin_precio_catalogo'
    });
    expect(atajoPideMonto('consulta', [])).toBe(true);
    expect(resolverAtajoConsulta([])).toEqual({
      pedirMonto: true,
      motivo: 'sin_precio_catalogo'
    });
  });

  it('baño default 022 va precargado y es editable (no campo vacío)', () => {
    expect(atajoPideMonto('banio')).toBe(true);
    const r = resolverPrecioBanioPos({
      tamano: 'mediano',
      defaults: MOCK_DEFAULTS_BANIO_TAMANO,
      plantillas: []
    });
    expect(r.editable).toBe(true);
    expect(r.precio).toBe(350);
    expect(r.fuente).toBe('defaults');
    expect(r.inputLabel).toBe(COPY_BANIO_AJUSTABLE);
    expect(valorInicialPromptBanio(r.precio)).toBe(350);
    expect(valorInicialPromptBanio(null)).toBe('');
  });

  it('baño usa plantilla 022 si no hay default de tamaño', () => {
    const plantillas: PlantillaCosto[] = [MOCK_PLANTILLA_COSTO];
    const r = resolverPrecioBanioPos({
      tamano: 'mediano',
      defaults: emptyDefaultsBanio(),
      plantillas
    });
    expect(r.precio).toBe(350);
    expect(r.fuente).toBe('plantilla');
    expect(r.editable).toBe(true);
  });

  it('baño cae a inventario / ProductosPeluqueria si no hay 022', () => {
    const desdeInventario = resolverPrecioBanioPos({
      defaults: emptyDefaultsBanio(),
      plantillas: [],
      catalogoInventario: MOCK_PRODUCTOS_POS
    });
    expect(desdeInventario.precio).toBe(250);
    expect(desdeInventario.fuente).toBe('inventario');

    const desdePeluqueria = resolverPrecioBanioPos({
      defaults: emptyDefaultsBanio(),
      plantillas: [],
      productosPeluqueria: [{ nombre: 'Baño básico', precio: 220, activo: true }]
    });
    expect(desdePeluqueria.precio).toBe(220);
    expect(desdePeluqueria.fuente).toBe('productos_peluqueria');
  });

  it('infiere tamaño de mascota para el default de baño', () => {
    expect(inferirTamanoBanio({ tamano_perro: 'chico' })).toBe('pequeno');
    expect(inferirTamanoBanio({ tamano: 'grande' })).toBe('grande');
    expect(inferirTamanoBanio({})).toBe('');
  });
});
