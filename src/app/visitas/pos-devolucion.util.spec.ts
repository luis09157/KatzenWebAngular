import {
  lineasADevolver,
  marcarLineasDevueltas,
  montoDevolucion,
  puedeDevolverLinea,
  reintegrosInventario
} from './pos-devolucion.util';
import { VisitaLinea } from './visitas.models';

const linea = (partial: Partial<VisitaLinea>): VisitaLinea =>
  ({
    id: 'l1',
    descripcion: 'Croqueta',
    monto: 116,
    categoria: 'venta_producto',
    productoId: 'p1',
    cantidad: 2,
    ...partial
  }) as VisitaLinea;

describe('pos-devolucion (spec 064 ola B)', () => {
  it('no deja devolver dos veces', () => {
    expect(puedeDevolverLinea(linea({ fueDevuelto: true }))).toBeFalse();
    expect(puedeDevolverLinea(linea({}))).toBeTrue();
  });

  it('agrupa reintegro de stock por producto', () => {
    const r = reintegrosInventario([
      linea({ id: 'a', productoId: 'p1', cantidad: 2 }),
      linea({ id: 'b', productoId: 'p1', cantidad: 1 }),
      linea({ id: 'c', categoria: 'consulta', productoId: undefined, cantidad: 1, monto: 200 })
    ]);
    expect(r).toEqual([{ productoId: 'p1', cantidad: 3 }]);
  });

  it('marca y suma monto', () => {
    const lineas = [linea({ id: 'a' }), linea({ id: 'b', monto: 50 })];
    const sel = lineasADevolver(lineas, ['a']);
    expect(montoDevolucion(sel)).toBe(116);
    const marked = marcarLineasDevueltas(lineas, ['a'], '2026-08-31T12:00:00.000Z');
    expect(marked[0].fueDevuelto).toBeTrue();
    expect(marked[1].fueDevuelto).toBeFalsy();
  });
});
