import { calcularCorteCaja, efectivoNetoDelDia } from './caja-corte.util';
import { CajaMovimiento } from './caja.models';

describe('caja-corte (spec 064 ola B)', () => {
  it('esperado = fondo + ingresos − egresos', () => {
    const r = calcularCorteCaja({
      fondoInicial: 500,
      ingresosEfectivo: 1160,
      egresosEfectivo: 60,
      efectivoContado: 1600
    });
    expect(r.esperado).toBe(1600);
    expect(r.diferencia).toBe(0);
    expect(r.cuadrado).toBeTrue();
  });

  it('marca faltante si contaron de menos', () => {
    const r = calcularCorteCaja({
      fondoInicial: 200,
      ingresosEfectivo: 100,
      egresosEfectivo: 0,
      efectivoContado: 280
    });
    expect(r.esperado).toBe(300);
    expect(r.diferencia).toBe(-20);
    expect(r.cuadrado).toBeFalse();
  });

  it('suma solo efectivo del día', () => {
    const movs = [
      { tipo: 'ingreso', monto: 50, metodoPago: 'efectivo', fecha: '2026-08-31', activo: true },
      { tipo: 'ingreso', monto: 80, metodoPago: 'tarjeta', fecha: '2026-08-31', activo: true },
      { tipo: 'egreso', monto: 10, metodoPago: 'efectivo', fecha: '2026-08-31', activo: true },
      { tipo: 'ingreso', monto: 99, metodoPago: 'efectivo', fecha: '2026-08-30', activo: true }
    ] as CajaMovimiento[];
    expect(efectivoNetoDelDia(movs, '2026-08-31')).toEqual({ ingresos: 50, egresos: 10 });
  });
});
