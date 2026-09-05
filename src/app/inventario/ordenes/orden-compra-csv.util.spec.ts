import { columnasCsvOrdenes, mapOrdenACsvRow, nombreArchivoCsvOrdenes } from './orden-compra-csv.util';
import { OrdenCompra } from '../../shared/inventario.models';

describe('orden-compra-csv.util (spec 071)', () => {
  it('arma fila CSV con ítems y totales', () => {
    const orden = {
      folio: 'OC-1',
      fecha_orden: '2026-09-04T12:00:00.000Z',
      estado: 'enviada',
      subtotal: 100,
      iva: 16,
      total: 116,
      observaciones: 'Urgente',
      items: [
        { producto_id: 'p1', producto_nombre: 'Jeringas', cantidad_solicitada: 10 },
        { producto_id: 'p2', cantidad_solicitada: 2 },
      ],
    } as OrdenCompra;
    const row = mapOrdenACsvRow(orden, 'Proveta');
    expect(row.folio).toBe('OC-1');
    expect(row.fecha).toBe('2026-09-04');
    expect(row.proveedor).toBe('Proveta');
    expect(row.items).toBe('Jeringas x10; p2 x2');
    expect(row.total).toBe('116.00');
    expect(columnasCsvOrdenes().length).toBe(9);
    expect(nombreArchivoCsvOrdenes('2026-09-04')).toBe('ordenes-compra-2026-09-04.csv');
  });
});
