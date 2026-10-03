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
    titulo: `Item ${id}`,
    meta: '',
  });

  it('vacio es true sin filas', () => {
    const c = new PosSheetCarritoComponent();
    expect(c.vacio).toBe(true);
    c.filas = [fila('a')];
    expect(c.vacio).toBe(false);
  });

  it('emite agregarProducto desde empty CTA (084)', () => {
    const c = new PosSheetCarritoComponent();
    let fired = false;
    c.agregarProducto.subscribe(() => {
      fired = true;
    });
    c.agregarProducto.emit();
    expect(fired).toBe(true);
    expect(c.vacio).toBe(true);
  });
});
