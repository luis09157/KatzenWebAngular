import { Producto } from '../shared/inventario.models';
import { VisitaLinea } from './visitas.models';
import {
  abrirSheetCarrito,
  abrirSheetLinea,
  abrirSheetProducto,
  abrirSheetScanner,
  cerrarPosSheet,
  deltaCantidadConfirmSheet,
  montoPreviewPosSheet,
  puedeQuitarLineaSheet,
  resolverProductoEscaneado,
  sheetQtyMas,
  sheetQtyMenos,
  tituloPosSheet,
} from './pos-sheet.util';

describe('pos-sheet.util (077)', () => {
  const producto: Producto = {
    id: 'p1',
    nombre: 'Croqueta',
    precio_venta: 100,
    activo: true,
    codigo_barras: '750123',
  } as Producto;

  const linea: VisitaLinea = {
    id: 'l1',
    descripcion: 'Croqueta x2',
    monto: 200,
    cantidad: 2,
    categoria: 'venta_producto',
    productoId: 'p1',
  };

  it('titulo según modo', () => {
    expect(tituloPosSheet('scanner', null, null)).toBe('Código o QR');
    expect(tituloPosSheet('linea', null, linea)).toBe('Croqueta x2');
    expect(tituloPosSheet('producto', producto, null)).toBe('Croqueta');
    expect(tituloPosSheet('producto', null, null)).toBe('Producto');
  });

  it('monto preview producto y línea', () => {
    expect(montoPreviewPosSheet('producto', 3, producto, null)).toBe(300);
    expect(montoPreviewPosSheet('linea', 1, null, linea)).toBe(100);
  });

  it('puedeQuitarLineaSheet respeta pagado e inventario', () => {
    expect(puedeQuitarLineaSheet(0, linea)).toBe(true);
    expect(puedeQuitarLineaSheet(10, linea)).toBe(false);
    expect(puedeQuitarLineaSheet(0, { ...linea, movimientoInventarioId: 'm1' })).toBe(false);
  });

  it('qty ± no baja de 1', () => {
    expect(sheetQtyMas(1)).toBe(2);
    expect(sheetQtyMenos(1)).toBe(1);
    expect(sheetQtyMenos(3)).toBe(2);
  });

  it('abrir/cerrar sheets', () => {
    expect(abrirSheetProducto(producto)).toEqual(
      jasmine.objectContaining({ abierta: true, modo: 'producto', qty: 1, producto })
    );
    expect(abrirSheetLinea(linea).qty).toBe(2);
    expect(abrirSheetCarrito().modo).toBe('carrito');
    expect(abrirSheetScanner(' 750 ').scannerCodigo).toBe('750');
    expect(cerrarPosSheet().abierta).toBe(false);
  });

  it('resolverProductoEscaneado: exacto o único hit', () => {
    const otro = { ...producto, id: 'p2', nombre: 'Croqueta lite', codigo_barras: '999' } as Producto;
    expect(resolverProductoEscaneado([producto, otro], '750123')?.id).toBe('p1');
    expect(resolverProductoEscaneado([producto], 'Croqueta')?.id).toBe('p1');
    // Varios hits parciales sin código exacto → no auto-elige
    expect(resolverProductoEscaneado([producto, otro], 'croqueta')).toBeNull();
    expect(resolverProductoEscaneado([producto], '')).toBeNull();
  });

  it('deltaCantidadConfirmSheet', () => {
    expect(deltaCantidadConfirmSheet(linea, 2)).toBe(0);
    expect(deltaCantidadConfirmSheet(linea, 5)).toBe(3);
    expect(deltaCantidadConfirmSheet(linea, 1)).toBe(-1);
    expect(deltaCantidadConfirmSheet(null, 2)).toBe(0);
  });
});
