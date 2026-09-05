import { Producto } from '../shared/inventario.models';
import {
  MENSAJE_KIT_SIN_BOM,
  bomDeProducto,
  buscarProductoPorCodigoKit,
  productoEsKit,
  resolverVentaKit,
  stockReservadoEnCarrito,
} from './pos-kit-bom.util';

function prod(partial: Partial<Producto> & { id: string; nombre: string }): Producto {
  return {
    codigo_barras: '',
    descripcion: '',
    categoria: 'vacuna',
    subcategoria: '',
    marca: '',
    presentacion: '',
    unidad_medida: 'dosis',
    stock_actual: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    punto_reorden: 0,
    ubicacion_almacen: '',
    requiere_refrigeracion: false,
    fecha_caducidad_alerta_dias: 0,
    precio_compra: 0,
    precio_venta: 100,
    margen_ganancia: 0,
    iva_aplicable: false,
    proveedor_principal_id: '',
    proveedores_alternos: [],
    requiere_receta: false,
    controlado: false,
    activo: true,
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('pos-kit-bom.util', () => {
  const v002 = prod({ id: 'id-v002', nombre: 'Vacuna A', pdvCodigo: 'V002', stock_actual: 10 });
  const v003 = prod({ id: 'id-v003', nombre: 'Vacuna B', pdvCodigo: 'V003', stock_actual: 2 });
  const kit = prod({
    id: 'id-kit',
    nombre: 'Paq Cachorro',
    pdvCodigo: 'PAQ001',
    esKit: true,
    stock_actual: 0,
    kitComponentes: [
      { codigo: 'V002', cantidad: 3 },
      { codigo: 'V003', cantidad: 1 },
    ],
  });

  it('productoEsKit por bandera o BOM', () => {
    expect(productoEsKit(kit)).toBeTrue();
    expect(productoEsKit(prod({ id: 'x', nombre: 'Sueltos', esKit: true }))).toBeTrue();
    expect(productoEsKit(v002)).toBeFalse();
  });

  it('bomDeProducto ignora filas inválidas', () => {
    expect(bomDeProducto(kit).length).toBe(2);
    expect(bomDeProducto(prod({ id: 'k', nombre: 'K', esKit: true, kitComponentes: [] }))).toEqual([]);
    expect(
      bomDeProducto(
        prod({
          id: 'k',
          nombre: 'K',
          kitComponentes: [
            { codigo: '', cantidad: 1 },
            { codigo: 'V002', cantidad: 0 },
          ],
        })
      )
    ).toEqual([]);
  });

  it('buscarProductoPorCodigoKit usa pdvCodigo o código de barras', () => {
    const barra = prod({ id: 'b', nombre: 'EAN', codigo_barras: '750123', pdvCodigo: '' });
    expect(buscarProductoPorCodigoKit([v002, barra], 'v002')?.id).toBe('id-v002');
    expect(buscarProductoPorCodigoKit([barra], '750123')?.id).toBe('b');
    expect(buscarProductoPorCodigoKit([v002], 'NOPE')).toBeUndefined();
  });

  it('kit con BOM y stock suficiente arma N salidas', () => {
    const r = resolverVentaKit(kit, 1, [v002, v003, kit]);
    expect(r.ok).toBeTrue();
    expect(r.motivo).toBe('ok');
    expect(r.salidas.map((s) => ({ id: s.productoId, qty: s.cantidad }))).toEqual([
      { id: 'id-v002', qty: 3 },
      { id: 'id-v003', qty: 1 },
    ]);
  });

  it('multiplica el BOM por la cantidad de kits', () => {
    const r = resolverVentaKit(kit, 2, [v002, v003, kit]);
    expect(r.ok).toBeTrue();
    expect(r.salidas[0].cantidad).toBe(6);
    expect(r.salidas[1].cantidad).toBe(2);
  });

  it('sin BOM no dice «Sin stock»', () => {
    const huerfano = prod({ id: 'h', nombre: 'Paq huérfano', esKit: true, stock_actual: 0 });
    const r = resolverVentaKit(huerfano, 1, [huerfano]);
    expect(r.ok).toBeFalse();
    expect(r.motivo).toBe('sin_bom');
    expect(r.mensaje).toBe(MENSAJE_KIT_SIN_BOM);
  });

  it('componente ausente en catálogo', () => {
    const r = resolverVentaKit(kit, 1, [v002, kit]);
    expect(r.ok).toBeFalse();
    expect(r.motivo).toBe('componente_faltante');
    expect(r.mensaje).toContain('V003');
  });

  it('valida stock de componentes, no el SKU kit en 0', () => {
    const poco = { ...v003, stock_actual: 0 };
    const r = resolverVentaKit(kit, 1, [v002, poco, kit]);
    expect(r.ok).toBeFalse();
    expect(r.motivo).toBe('sin_stock');
    expect(r.mensaje).toContain('Vacuna B');
  });

  it('resta reservas del carrito al validar', () => {
    const r = resolverVentaKit(kit, 1, [v002, v003, kit], { 'id-v003': 2 });
    expect(r.ok).toBeFalse();
    expect(r.motivo).toBe('sin_stock');
  });

  it('stockReservadoEnCarrito explota otros kits y suma sueltos', () => {
    const reserved = stockReservadoEnCarrito(
      [
        { productoId: 'id-kit', cantidad: 1, categoria: 'venta_producto' },
        { productoId: 'id-v002', cantidad: 1, categoria: 'venta_producto' },
        { productoId: 'consulta', cantidad: 1, categoria: 'consulta' },
      ],
      [v002, v003, kit]
    );
    expect(reserved['id-v002']).toBe(4);
    expect(reserved['id-v003']).toBe(1);
    expect(reserved['id-kit']).toBeUndefined();
  });

  it('producto normal no es error de kit', () => {
    const r = resolverVentaKit(v002, 1, [v002]);
    expect(r.ok).toBeTrue();
    expect(r.motivo).toBe('no_es_kit');
    expect(r.salidas.length).toBe(0);
  });
});
