import {
  MOCK_PRODUCTO_DEMO_POS_BANIO,
  MOCK_PRODUCTO_DEMO_POS_COLLAR,
  MOCK_PRODUCTO_DEMO_POS_CONSULTA,
  MOCK_PRODUCTO_DEMO_POS_CORTE,
  MOCK_PRODUCTO_DEMO_POS_CROQUETA,
  MOCK_PRODUCTO_DEMO_POS_MEDICAMENTO,
  MOCK_PRODUCTOS_POS
} from '../core/testing/mock-data';
import { Producto } from '../shared/inventario.models';
import { VisitaLinea } from './visitas.models';
import { filtrarProductosPorRiel } from './pos-rieles.util';
import {
  BANNER_CATALOGO_DEMO_POS,
  PREFIJO_ID_DEMO_POS,
  contarDemoPorRiel,
  debeMostrarCatalogoDemoPos,
  esIdProductoDemoPos,
  esIdPushRtdb,
  esProductoDemoPos,
  idsElegiblesParaRegistrarSalida,
  lineasSinProductosDemo,
  mezclarCatalogoPos,
  productosElegiblesParaCrearEnInventario
} from './pos-catalogo-demo.util';

describe('pos-catalogo-demo (055 muestra UI — no catálogo real)', () => {
  it('los 6 ítems son demo: soloDemo, origen pos_preview e ids demo-pos-*', () => {
    expect(MOCK_PRODUCTOS_POS.length).toBe(6);
    expect(MOCK_PRODUCTOS_POS.every((p) => p.soloDemo === true)).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => p.origen === 'pos_preview')).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => esProductoDemoPos(p))).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => esIdProductoDemoPos(p.id))).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => String(p.id).startsWith(PREFIJO_ID_DEMO_POS))).toBe(true);
    expect(MOCK_PRODUCTOS_POS.map((p) => p.id)).toEqual([
      'demo-pos-petshop-1',
      'demo-pos-petshop-2',
      'demo-pos-consulta-1',
      'demo-pos-consulta-2',
      'demo-pos-peluqueria-1',
      'demo-pos-peluqueria-2'
    ]);
  });

  it('ningún id coincide con el patrón de push RTDB', () => {
    expect(esIdPushRtdb('-NabcDEF0123456789_x')).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => !esIdPushRtdb(p.id))).toBe(true);
    expect(esIdPushRtdb('demo-pos-petshop-1')).toBe(false);
  });

  it('hay exactamente 2 por riel (petshop, consulta, peluqueria)', () => {
    const counts = contarDemoPorRiel(MOCK_PRODUCTOS_POS);
    expect(counts).toEqual({ petshop: 2, consulta: 2, peluqueria: 2 });
    expect(filtrarProductosPorRiel(MOCK_PRODUCTOS_POS, 'petshop').map((p) => p.id)).toEqual([
      MOCK_PRODUCTO_DEMO_POS_CROQUETA.id,
      MOCK_PRODUCTO_DEMO_POS_COLLAR.id
    ]);
    expect(filtrarProductosPorRiel(MOCK_PRODUCTOS_POS, 'consulta').map((p) => p.id)).toEqual([
      MOCK_PRODUCTO_DEMO_POS_CONSULTA.id,
      MOCK_PRODUCTO_DEMO_POS_MEDICAMENTO.id
    ]);
    expect(filtrarProductosPorRiel(MOCK_PRODUCTOS_POS, 'peluqueria').map((p) => p.id)).toEqual([
      MOCK_PRODUCTO_DEMO_POS_BANIO.id,
      MOCK_PRODUCTO_DEMO_POS_CORTE.id
    ]);
  });

  it('no se pasan a InventarioService.registrarSalida ni crearProducto', () => {
    const registrarSalida = jasmine.createSpy('registrarSalida');
    const crearProducto = jasmine.createSpy('crearProducto');
    const lineas: VisitaLinea[] = MOCK_PRODUCTOS_POS.map((p) => ({
      id: `linea-${p.id}`,
      descripcion: p.nombre,
      monto: p.precio_venta,
      categoria: 'venta_producto' as const,
      productoId: p.id,
      cantidad: 1
    }));

    const idsSalida = idsElegiblesParaRegistrarSalida(lineas, MOCK_PRODUCTOS_POS);
    expect(idsSalida).toEqual([]);
    idsSalida.forEach((id) => registrarSalida(id, 1, 'venta_directa'));
    expect(registrarSalida).not.toHaveBeenCalled();

    const paraCrear = productosElegiblesParaCrearEnInventario(MOCK_PRODUCTOS_POS);
    expect(paraCrear).toEqual([]);
    paraCrear.forEach((p) => crearProducto(p));
    expect(crearProducto).not.toHaveBeenCalled();

    expect(lineasSinProductosDemo(lineas, MOCK_PRODUCTOS_POS)).toEqual([]);
  });

  it('una línea real sí es elegible para salida; las demo se filtran', () => {
    const real: Producto = {
      ...MOCK_PRODUCTO_DEMO_POS_CROQUETA,
      id: '-NabcDEF0123456789_x',
      soloDemo: false,
      origen: undefined,
      rielPos: undefined
    };
    const lineas: VisitaLinea[] = [
      {
        id: 'l-demo',
        descripcion: 'demo',
        monto: 10,
        categoria: 'venta_producto',
        productoId: 'demo-pos-petshop-1',
        cantidad: 1
      },
      {
        id: 'l-real',
        descripcion: 'real',
        monto: 20,
        categoria: 'venta_producto',
        productoId: real.id,
        cantidad: 2
      }
    ];
    expect(idsElegiblesParaRegistrarSalida(lineas, [real, ...MOCK_PRODUCTOS_POS])).toEqual([
      '-NabcDEF0123456789_x'
    ]);
  });

  it('flag usarCatalogoDemoPos: OFF en prod, no mezcla demo con RTDB', () => {
    expect(debeMostrarCatalogoDemoPos({ production: true, usarCatalogoDemoPos: false })).toBe(false);
    expect(debeMostrarCatalogoDemoPos({ production: true })).toBe(false);
    expect(debeMostrarCatalogoDemoPos({ production: false })).toBe(false);
    expect(debeMostrarCatalogoDemoPos({ production: false, usarCatalogoDemoPos: true })).toBe(true);
    expect(debeMostrarCatalogoDemoPos({ production: true, usarCatalogoDemoPos: true })).toBe(true);

    const rtdb: Producto[] = [
      { ...MOCK_PRODUCTO_DEMO_POS_CROQUETA, id: '-NabcDEF0123456789_x', soloDemo: false, origen: undefined }
    ];
    expect(mezclarCatalogoPos(rtdb, MOCK_PRODUCTOS_POS, false).map((p) => p.id)).toEqual([
      '-NabcDEF0123456789_x'
    ]);
    expect(mezclarCatalogoPos(rtdb, MOCK_PRODUCTOS_POS, true)[0].id).toBe('demo-pos-petshop-1');
    expect(mezclarCatalogoPos(rtdb, MOCK_PRODUCTOS_POS, true).some((p) => p.id === '-NabcDEF0123456789_x')).toBe(
      true
    );
  });

  it('banner de muestra y fotos locales (no URL rota)', () => {
    expect(BANNER_CATALOGO_DEMO_POS).toBe('Catálogo de muestra — no se guarda');
    expect(MOCK_PRODUCTOS_POS.every((p) => String(p.imagen_url).startsWith('assets/pos-demo/'))).toBe(true);
    expect(MOCK_PRODUCTOS_POS.every((p) => String(p.imagen_url).endsWith('.png'))).toBe(true);
  });
});
