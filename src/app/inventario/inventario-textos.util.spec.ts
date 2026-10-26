import { cantidadConUnidad, motivoMovimientoTexto, nombreResponsable } from './inventario-textos.util';

describe('inventario-textos.util', () => {
  it('traduce motivos guardados como código', () => {
    expect(motivoMovimientoTexto('venta_directa')).toBe('Venta');
    expect(motivoMovimientoTexto('uso_consulta')).toBe('Usado en consulta');
    expect(motivoMovimientoTexto('algo_raro_nuevo')).toBe('Algo raro nuevo');
    expect(motivoMovimientoTexto('Entrada por compra')).toBe('Entrada por compra');
    expect(motivoMovimientoTexto('')).toBe('—');
  });

  it('pone plural a la unidad', () => {
    expect(cantidadConUnidad(0, 'unidad')).toBe('0 unidades');
    expect(cantidadConUnidad(1, 'unidad')).toBe('1 unidad');
    expect(cantidadConUnidad(3, 'caja')).toBe('3 cajas');
    expect(cantidadConUnidad(2, 'capsula')).toBe('2 cápsulas');
    expect(cantidadConUnidad(250, 'ml')).toBe('250 ml');
    expect(cantidadConUnidad(4, 'dosis')).toBe('4 dosis');
    expect(cantidadConUnidad(5, '')).toBe('5');
  });

  it('muestra nombre en vez de uid', () => {
    const m = new Map([['abc123', 'Dra. Ana']]);
    expect(nombreResponsable('abc123', m)).toBe('Dra. Ana');
    expect(nombreResponsable('zzz', m)).toBe('Otro usuario');
    expect(nombreResponsable('', m)).toBe('Sistema');
  });
});
