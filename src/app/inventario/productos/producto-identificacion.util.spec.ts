import {
  esCodigoInternoKatzen,
  generarCodigoInternoProducto,
  marcaProductoODefault,
  presetProductoPorCategoria
} from './producto-identificacion.util';

describe('producto-identificacion.util', () => {
  it('genera código interno estable por categoría', () => {
    const codigo = generarCodigoInternoProducto('medicamento', {
      now: new Date(2026, 7, 26),
      aleatorio: 'a1b2'
    });
    expect(codigo).toBe('KZ-MED-260826-A1B2');
    expect(esCodigoInternoKatzen(codigo)).toBe(true);
  });

  it('usa prefijo VAC para vacunas', () => {
    const codigo = generarCodigoInternoProducto('vacuna', {
      now: new Date(2026, 0, 2),
      aleatorio: 'zz99'
    });
    expect(codigo).toBe('KZ-VAC-260102-ZZ99');
  });

  it('no trata un EAN de fábrica como código interno', () => {
    expect(esCodigoInternoKatzen('7501234567890')).toBe(false);
    expect(esCodigoInternoKatzen('')).toBe(false);
  });

  it('preset de vacuna: dosis + refrigeración', () => {
    const p = presetProductoPorCategoria('vacuna');
    expect(p.unidad).toBe('dosis');
    expect(p.requiere_refrigeracion).toBe(true);
    expect(p.presentacion).toBe('Frasco');
  });

  it('preset de alimento: kg / bolsa', () => {
    const p = presetProductoPorCategoria('alimento');
    expect(p.unidad).toBe('kg');
    expect(p.presentacion).toBe('Bolsa');
    expect(p.requiere_refrigeracion).toBe(false);
  });

  it('preset de medicamento: tableta', () => {
    expect(presetProductoPorCategoria('medicamento').unidad).toBe('tableta');
  });

  it('marca vacía → S/M', () => {
    expect(marcaProductoODefault('')).toBe('S/M');
    expect(marcaProductoODefault('  Pfizer  ')).toBe('Pfizer');
  });

  it('genera data URL QR a partir del código', async () => {
    const { generarQrDataUrl } = await import('./producto-identificacion.util');
    const url = await generarQrDataUrl('KZ-MED-260826-TEST');
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
  });
});
