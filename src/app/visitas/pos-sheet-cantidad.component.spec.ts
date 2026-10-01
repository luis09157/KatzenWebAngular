import { PosSheetCantidadComponent } from './pos-sheet-cantidad.component';

describe('PosSheetCantidadComponent (spec 081)', () => {
  it('labelConfirmar distingue producto vs línea', () => {
    const c = new PosSheetCantidadComponent();
    c.modo = 'producto';
    expect(c.labelConfirmar).toBe('Agregar al ticket');
    expect(c.esLinea).toBe(false);
    c.modo = 'linea';
    expect(c.labelConfirmar).toBe('Actualizar');
    expect(c.esLinea).toBe(true);
  });
});
