import { PosSheetCarritoComponent, PosSheetCarritoFila } from './pos-sheet-carrito.component';
import { VisitaLinea } from './visitas.models';

describe('PosSheetCarritoComponent (spec 082)', () => {
  const linea = (id: string): VisitaLinea => ({
    id,
    descripcion: `Item ${id}`,
    monto: 100,
    categoria: 'venta_producto',
    cantidad: 2,
  });

  const fila = (id: string): PosSheetCarritoFila => ({
    linea: linea(id),
    fotoUrl: '',
    icono: 'inventory_2',
    montoLabel: '$100.00',
    cantidad: 2,
    puedeAjustar: true,
  });

  it('vacio es true sin filas', () => {
    const c = new PosSheetCarritoComponent();
    expect(c.vacio).toBe(true);
    c.filas = [fila('a')];
    expect(c.vacio).toBe(false);
  });

  it('onAjustar / onQuitar emiten con la línea', () => {
    const c = new PosSheetCarritoComponent();
    const f = fila('x');
    const ev = new Event('click');
    const ajustes: Array<{ id: string; delta: number }> = [];
    const quites: string[] = [];
    c.ajustar.subscribe((p) => ajustes.push({ id: p.linea.id, delta: p.delta }));
    c.quitar.subscribe((p) => quites.push(p.linea.id));
    c.onAjustar(f, 1, ev);
    c.onQuitar(f, ev);
    expect(ajustes).toEqual([{ id: 'x', delta: 1 }]);
    expect(quites).toEqual(['x']);
  });
});
