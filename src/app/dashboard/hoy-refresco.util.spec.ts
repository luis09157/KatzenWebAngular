import { refrescoHoy } from './hoy-refresco.util';

describe('hoy-refresco.util', () => {
  const ahora = new Date(2026, 9, 30, 9, 0);
  it('si cambió el día, recarga', () => {
    expect(refrescoHoy('2026-10-29', ahora.getTime(), ahora)).toEqual({ recargarPagina: true, recontarAvisos: false });
  });
  it('mismo día: recuenta avisos solo si pasaron 10 minutos', () => {
    expect(refrescoHoy('2026-10-30', ahora.getTime() - 5 * 60_000, ahora)).toEqual({
      recargarPagina: false,
      recontarAvisos: false,
    });
    expect(refrescoHoy('2026-10-30', ahora.getTime() - 11 * 60_000, ahora)).toEqual({
      recargarPagina: false,
      recontarAvisos: true,
    });
  });
  it('a las 11:59 pm sigue siendo el mismo día', () => {
    const noche = new Date(2026, 9, 30, 23, 59);
    expect(refrescoHoy('2026-10-30', noche.getTime(), noche).recargarPagina).toBeFalse();
  });
});
