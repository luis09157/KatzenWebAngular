import {
  buildCalendarioMesDays,
  buildCitasMapByDate,
  citaFechaIsoKey,
  isoKeyFromLocalDate,
  labelDiaSeleccionado,
} from './dashboard-calendario.util';

describe('dashboard-calendario.util (072)', () => {
  it('citaFechaIsoKey toma fecha o fecha_hora', () => {
    expect(citaFechaIsoKey({ fecha: '2026-10-18' })).toBe('2026-10-18');
    expect(citaFechaIsoKey({ fecha_hora: '2026-10-19T15:00:00' })).toBe('2026-10-19');
    expect(citaFechaIsoKey({})).toBeNull();
  });

  it('buildCitasMapByDate agrupa activas y ordena por hora', () => {
    const map = buildCitasMapByDate([
      { fecha: '2026-10-18', hora: '11:00', activo: true },
      { fecha: '2026-10-18', hora: '09:00', activo: true },
      { fecha: '2026-10-18', hora: '10:00', activo: false },
      { fecha: '2026-10-19', hora: '08:00' },
    ]);
    expect(map['2026-10-18'].map((c) => c.hora)).toEqual(['09:00', '11:00']);
    expect(map['2026-10-19'].length).toBe(1);
  });

  it('buildCalendarioMesDays marca hoy y citas', () => {
    const anchor = new Date(2026, 9, 1); // octubre 2026
    const today = new Date(2026, 9, 18);
    const map = buildCitasMapByDate([{ fecha: '2026-10-18', hora: '10:00' }]);
    const days = buildCalendarioMesDays(anchor, map, today);
    const cell = days.find((d) => d.isoKey === '2026-10-18');
    expect(cell?.isToday).toBe(true);
    expect(cell?.hasCitas).toBe(true);
    expect(cell?.citas.length).toBe(1);
    expect(days.every((d) => d.isCurrentMonth || !d.isoKey)).toBe(true);
  });

  it('isoKeyFromLocalDate y labelDiaSeleccionado', () => {
    expect(isoKeyFromLocalDate(new Date(2026, 9, 18))).toBe('2026-10-18');
    expect(labelDiaSeleccionado('2026-10-18', '2026-10-18')).toBe('Citas de hoy');
    expect(labelDiaSeleccionado(null, '2026-10-18')).toBe('Selecciona un día');
    expect(labelDiaSeleccionado('2026-10-20', '2026-10-18')).toContain('20');
  });
});
