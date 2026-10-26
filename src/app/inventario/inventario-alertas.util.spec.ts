import { alertaSigueVigente, requiereAlertaReorden, requiereAlertaStockBajo } from './inventario-alertas.util';

describe('inventario-alertas.util (2026-10-26)', () => {
  const med = { categoria: 'medicamento' as const, stock_actual: 1, stock_minimo: 2, punto_reorden: 4 };

  it('stock bajo solo con mínimo definido y nunca en servicios', () => {
    expect(requiereAlertaStockBajo(med)).toBeTrue();
    expect(requiereAlertaStockBajo({ ...med, stock_minimo: 0, stock_actual: 0 })).toBeFalse();
    expect(requiereAlertaStockBajo({ categoria: 'peluqueria', stock_actual: 0, stock_minimo: 1 })).toBeFalse();
    expect(requiereAlertaStockBajo({ ...med, activo: false })).toBeFalse();
  });

  it('reorden: por debajo del punto pero arriba del mínimo', () => {
    expect(requiereAlertaReorden({ ...med, stock_actual: 3 })).toBeTrue();
    expect(requiereAlertaReorden(med)).toBeFalse();
    expect(requiereAlertaReorden({ ...med, punto_reorden: 0, stock_actual: 3 })).toBeFalse();
  });

  it('una alerta vieja deja de contar si el producto ya no cumple', () => {
    expect(alertaSigueVigente({ tipo: 'stock_bajo' }, { ...med, stock_actual: 10 })).toBeFalse();
    expect(alertaSigueVigente({ tipo: 'stock_bajo' }, med)).toBeTrue();
    expect(alertaSigueVigente({ tipo: 'stock_bajo' }, null)).toBeFalse();
    expect(alertaSigueVigente({ tipo: 'caducado' }, { ...med, fecha_caducidad: '2026-01-01', stock_actual: 0 })).toBeFalse();
  });
});
