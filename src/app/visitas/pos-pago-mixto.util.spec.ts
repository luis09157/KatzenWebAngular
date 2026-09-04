import { armarPartesPagoMixto, validarPagoContraSaldo } from './pos-pago-mixto.util';

describe('pos-pago-mixto (spec 064 ola B)', () => {
  it('arma solo partes con monto > 0', () => {
    const partes = armarPartesPagoMixto({ efectivo: 50, tarjeta: 66, transferencia: 0 });
    expect(partes).toEqual([
      { metodo: 'efectivo', monto: 50 },
      { metodo: 'tarjeta', monto: 66 }
    ]);
  });

  it('acepta suma igual al saldo (mixto completo)', () => {
    const partes = armarPartesPagoMixto({ efectivo: 100, tarjeta: 16 });
    const r = validarPagoContraSaldo(partes, 116);
    expect(r.ok).toBeTrue();
    expect(r.total).toBe(116);
  });

  it('acepta pago parcial mixto', () => {
    const partes = armarPartesPagoMixto({ efectivo: 40, transferencia: 10 });
    const r = validarPagoContraSaldo(partes, 116);
    expect(r.ok).toBeTrue();
    expect(r.total).toBe(50);
  });

  it('rechaza suma mayor al saldo', () => {
    const partes = armarPartesPagoMixto({ efectivo: 80, tarjeta: 50 });
    const r = validarPagoContraSaldo(partes, 116);
    expect(r.ok).toBeFalse();
  });

  it('rechaza todo en cero', () => {
    const r = validarPagoContraSaldo(armarPartesPagoMixto({}), 100);
    expect(r.ok).toBeFalse();
  });
});
