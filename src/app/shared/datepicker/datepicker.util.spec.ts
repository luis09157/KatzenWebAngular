import { coerceToIsoDate, formatLocalDateToIso, parseIsoDateToLocalDate } from './datepicker.util';

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
});
