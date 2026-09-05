import {
  HORA_CORTE_DEFAULT,
  debeMostrarBannerCorte,
  fechaTurnoLocal,
  fondoInicialDesdeUltimoCorte,
  puedeGuardarCorteDelDia,
  turnoEstaAbierto,
  yaHayCorteDelDia,
} from './caja-turno.util';

describe('caja-turno.util (spec 071)', () => {
  it('fechaTurnoLocal formatea YYYY-MM-DD en hora local', () => {
    expect(fechaTurnoLocal(new Date(2026, 8, 4, 22, 15))).toBe('2026-09-04');
  });

  it('turno abierto solo si hay abiertaEn y no hay corteId', () => {
    expect(turnoEstaAbierto(null)).toBeFalse();
    expect(turnoEstaAbierto({ abiertaEn: '2026-09-04T10:00:00.000Z' })).toBeTrue();
    expect(turnoEstaAbierto({ abiertaEn: '2026-09-04T10:00:00.000Z', corteId: 'c1' })).toBeFalse();
    expect(turnoEstaAbierto({ corteId: '' })).toBeFalse();
  });

  it('fondo = efectivoContado del último corte; 0 si no hay', () => {
    expect(fondoInicialDesdeUltimoCorte([])).toBe(0);
    expect(
      fondoInicialDesdeUltimoCorte([
        { fecha: '2026-09-02', createdAt: 'a', activo: true, efectivoContado: 200, esperado: 180 },
        { fecha: '2026-09-03', createdAt: 'b', activo: true, efectivoContado: 350, esperado: 340 },
        { fecha: '2026-09-03', createdAt: 'c', activo: false, efectivoContado: 999, esperado: 0 },
      ])
    ).toBe(350);
  });

  it('evita segundo corte el mismo día', () => {
    const cortes = [
      { fecha: '2026-09-04', activo: true },
      { fecha: '2026-09-03', activo: true },
    ];
    expect(yaHayCorteDelDia(cortes, '2026-09-04')).toBeTrue();
    expect(puedeGuardarCorteDelDia(cortes, '2026-09-04')).toBeFalse();
    expect(puedeGuardarCorteDelDia(cortes, '2026-09-05')).toBeTrue();
    expect(yaHayCorteDelDia([{ fecha: '2026-09-04', activo: false }], '2026-09-04')).toBeFalse();
  });

  it('banner: no muestra sin turno o si ya hay corte', () => {
    expect(
      debeMostrarBannerCorte({
        turnoAbierto: false,
        hayCorteHoy: false,
        huboVentasHoy: true,
        horaLocal: 19,
      })
    ).toBeFalse();
    expect(
      debeMostrarBannerCorte({
        turnoAbierto: true,
        hayCorteHoy: true,
        huboVentasHoy: true,
        horaLocal: 19,
      })
    ).toBeFalse();
  });

  it('banner: muestra después de las 18 o si ya hubo ventas', () => {
    expect(HORA_CORTE_DEFAULT).toBe(18);
    expect(
      debeMostrarBannerCorte({
        turnoAbierto: true,
        hayCorteHoy: false,
        huboVentasHoy: false,
        horaLocal: 18,
      })
    ).toBeTrue();
    expect(
      debeMostrarBannerCorte({
        turnoAbierto: true,
        hayCorteHoy: false,
        huboVentasHoy: true,
        horaLocal: 11,
      })
    ).toBeTrue();
    expect(
      debeMostrarBannerCorte({
        turnoAbierto: true,
        hayCorteHoy: false,
        huboVentasHoy: false,
        horaLocal: 11,
      })
    ).toBeFalse();
  });
});
