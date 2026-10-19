import {
  coerceToIsoDate,
  formatLocalDateTimeStamp,
  formatLocalDateToIso,
  formatearFechaLocalEs,
  parseIsoDateToLocalDate,
} from './datepicker.util';

describe('datepicker.util (090)', () => {
  it('parseIsoDateToLocalDate / formatLocalDateToIso round-trip', () => {
    const d = parseIsoDateToLocalDate('2026-10-02');
    expect(d).toBeTruthy();
    expect(formatLocalDateToIso(d)).toBe('2026-10-02');
  });

  it('coerceToIsoDate acepta Date e ISO fecha-solo', () => {
    expect(coerceToIsoDate('2026-03-15')).toBe('2026-03-15');
    expect(coerceToIsoDate(new Date(2026, 9, 2))).toBe('2026-10-02');
    expect(coerceToIsoDate(null)).toBe('');
  });

  it('rechaza basura', () => {
    expect(parseIsoDateToLocalDate('no-fecha')).toBeNull();
    expect(parseIsoDateToLocalDate('')).toBeNull();
  });

  it('formatLocalDateTimeStamp usa componentes locales (no UTC de toISOString)', () => {
    const localEvening = new Date(2026, 9, 18, 20, 35, 42);
    expect(formatLocalDateTimeStamp(localEvening)).toBe('2026-10-18 20:35:42');
    // Contraste: el día UTC de toISOString puede diferir del calendario local
    expect(formatLocalDateTimeStamp(localEvening).slice(0, 10)).toBe(formatLocalDateToIso(localEvening));
  });

  it('formatearFechaLocalEs no resta día en fecha-solo ISO (bug MX)', () => {
    // new Date('yyyy-MM-dd') = UTC midnight; display debe ser el día del string, no getDate() local
    expect(formatearFechaLocalEs('2026-10-19')).toBe('19/10/2026');
    expect(formatearFechaLocalEs('2026-10-18')).toBe('18/10/2026');
  });

  it('formatearFechaLocalEs usa día de calendario en created_at naive', () => {
    expect(formatearFechaLocalEs('2026-10-18 20:35:42')).toBe('18/10/2026');
    expect(formatearFechaLocalEs(new Date(2026, 9, 19))).toBe('19/10/2026');
  });
});
