import {
  calcularCorteCaja,
  efectivoNeto,
  efectivoNetoDelDia,
  fondoParaCorte,
  fondoSiguienteTrasRetiro,
  movimientosPendientesDeCorte,
} from './caja-corte.util';
import { CajaCorte, CajaMovimiento } from './caja.models';
import { puedeGuardarCorteDelDia } from './caja-turno.util';

describe('caja-corte (spec 064 ola B)', () => {
  it('esperado = fondo + ingresos − egresos', () => {
    const r = calcularCorteCaja({
      fondoInicial: 500,
      ingresosEfectivo: 1160,
      egresosEfectivo: 60,
      efectivoContado: 1600,
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
      efectivoContado: 280,
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
      { tipo: 'ingreso', monto: 99, metodoPago: 'efectivo', fecha: '2026-08-30', activo: true },
    ] as CajaMovimiento[];
    expect(efectivoNetoDelDia(movs, '2026-08-31')).toEqual({ ingresos: 50, egresos: 10 });
  });

  it('no permite segundo corte el mismo día (071)', () => {
    expect(puedeGuardarCorteDelDia([{ fecha: '2026-09-04', activo: true }], '2026-09-04')).toBeFalse();
    expect(puedeGuardarCorteDelDia([], '2026-09-04')).toBeTrue();
  });
});

describe('caja-corte complementario / retiro (2026-10-26)', () => {
  const mov = (p: Partial<CajaMovimiento>) =>
    ({ tipo: 'ingreso', metodoPago: 'efectivo', fecha: '2026-10-26', activo: true, monto: 0, ...p }) as CajaMovimiento;
  const corte = (p: Partial<CajaCorte>) =>
    ({ fecha: '2026-10-26', activo: true, createdAt: '2026-10-26T20:00:00.000Z', efectivoContado: 0, esperado: 0, ...p }) as CajaCorte;

  it('sin corte: todos los movimientos del día están pendientes', () => {
    const movs = [mov({ monto: 100, createdAt: '2026-10-26T15:00:00.000Z' }), mov({ monto: 5, fecha: '2026-10-25' })];
    expect(movimientosPendientesDeCorte(movs, [], '2026-10-26').length).toBe(1);
  });

  it('con corte: solo lo cobrado después del corte', () => {
    const movs = [
      mov({ monto: 100, createdAt: '2026-10-26T15:00:00.000Z' }),
      mov({ monto: 40, createdAt: '2026-10-26T21:00:00.000Z' }),
    ];
    const pend = movimientosPendientesDeCorte(movs, [corte({})], '2026-10-26');
    expect(pend.map((m) => m.monto)).toEqual([40]);
    expect(efectivoNeto(pend)).toEqual({ ingresos: 40, egresos: 0 });
  });

  it('fondo: complementario arranca con lo que quedó; primer corte usa turno o el último corte anterior', () => {
    const previo = corte({ fecha: '2026-10-25', createdAt: '2026-10-25T23:00:00.000Z', efectivoContado: 3000, fondoSiguiente: 500 });
    expect(fondoParaCorte([previo], '2026-10-26', null)).toBe(500);
    expect(fondoParaCorte([previo], '2026-10-26', 700)).toBe(700);
    const hoy = corte({ efectivoContado: 1200, fondoSiguiente: 300 });
    expect(fondoParaCorte([previo, hoy], '2026-10-26', 700)).toBe(300);
  });

  it('día sin ventas con contado 0 cuadra', () => {
    expect(calcularCorteCaja({ fondoInicial: 0, ingresosEfectivo: 0, egresosEfectivo: 0, efectivoContado: 0 }).cuadrado).toBeTrue();
  });

  it('retiro: queda contado − retiro, nunca negativo', () => {
    expect(fondoSiguienteTrasRetiro(3000, 2500)).toBe(500);
    expect(fondoSiguienteTrasRetiro(100, 300)).toBe(0);
  });
});
